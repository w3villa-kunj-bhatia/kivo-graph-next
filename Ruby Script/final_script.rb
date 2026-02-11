require 'json'
require 'set'
require 'active_support/all'
require 'parser/current'

# ==========================================
# ⚙️ CONFIGURATION
# ==========================================

# 1. Module Definitions (Priority Order)
#    Matches your "Current Modules" list.
MODULE_RULES = [
  { 
    name: 'HRMS', 
    keywords: %w[hrms attend leave salary holiday shift ctc payroll onboard employee asset policy bonus appraisal manpower statutory on_duty] 
  },
  { 
    name: 'ATS', 
    keywords: %w[ats candid interv applic hiring resume recruit offer job_role sourcing pre_boarding] 
  },
  { 
    name: 'CRM', 
    keywords: %w[crm deal invoice lead client bill quote customer campaign contact help_center] 
  },
  { 
    name: 'Projects', 
    keywords: %w[project sprint story epic scrum kanban backlog task tracker board pms] 
  },
  { 
    name: 'AI', 
    keywords: %w[ai_ openai bot persona gpt voice eval cv product_inventory] 
  },
  { 
    name: 'Comm', 
    keywords: %w[chat messag channel email notif conversation mailer inbox] 
  },
  { 
    name: 'Inventory', 
    keywords: %w[inventory stock item warehouse procurement store material] 
  },
  { 
    name: 'Kivo_Calendar', 
    keywords: %w[calendar event booking availabil team_schedule meeting] 
  },
  { 
    name: 'Payroll', 
    keywords: %w[payroll payslip tax deduction allowance reimbursement] 
  },
  { 
    name: 'Test', 
    keywords: %w[test experiment demo sample] 
  },
  { 
    name: 'Core', 
    keywords: %w[user profile auth role company setting session permission login account feature address location] 
  }
]

# Fallback
DEFAULT_MODULE = 'Utils'

# 2. Scanning & Archetypes
PATH_CONFIG = {
  'app/models'      => 'Model',
  'app/services'    => 'Service',
  'app/controllers' => 'Controller',
  'app/jobs'        => 'Worker',
  'app/mailers'     => 'Mailer',
  'lib'             => 'Library'
}

# 3. Filtering
REMOVE_CONTROLLERS = false 

IGNORE_LIST = Set.new(%w[
  String Integer Array Hash Boolean Date DateTime Time File Dir
  ApplicationRecord ApplicationController ActiveJob::Base StandardError
  Rails ActiveRecord ActiveSupport Set
])

# ==========================================
# 🧠 AST PROCESSOR
# ==========================================
class DependencyVisitor < Parser::AST::Processor
  attr_reader :dependencies, :inheritance, :extensions

  def initialize
    @dependencies = Set.new
    @inheritance = nil
    @extensions = Set.new
  end

  def on_class(node)
    _name_node, superclass_node, _body_node = *node
    if superclass_node
      parent_name = unpack_const(superclass_node)
      @inheritance = parent_name if parent_name
    end
    super
  end

  def on_const(node)
    name = unpack_const(node)
    @dependencies.add(name) if name
    super
  end

  def on_send(node)
    _receiver, method_name, *args = *node
    if [:include, :extend, :prepend].include?(method_name)
      args.each do |arg|
        if arg.type == :const
          name = unpack_const(arg)
          @extensions.add(name) if name
        end
      end
    end
    super
  end

  private

  def unpack_const(node)
    return nil unless node.is_a?(Parser::AST::Node) && node.type == :const
    scope, name = *node
    scope ? "#{unpack_const(scope)}::#{name}" : name.to_s
  end
end

# ==========================================
# 🚀 MAIN EXECUTION
# ==========================================

nodes = []
edges = []
class_lookup = {}

puts "🔍 Scanning codebase..."

# 1. NODE GENERATION
PATH_CONFIG.each do |base_path, archetype|
  next unless Dir.exist?(base_path)

  Dir.glob("#{base_path}/**/*.rb").each do |file_path|
    content = File.read(file_path, mode: 'r:UTF-8', invalid: :replace, undef: :replace, replace: '') rescue ""
    
    loc = content.lines.count { |line| !line.strip.empty? && !line.strip.start_with?('#') }
    relative_path = file_path.sub("#{base_path}/", '').sub('.rb', '')
    class_name = relative_path.camelize 
    id = class_name.underscore.gsub('/', '_')
    search_text = (id + " " + class_name).downcase

    # --- FILTER ---
    if REMOVE_CONTROLLERS
      next if archetype == 'Controller' || id.end_with?('_controller')
    end

    # --- CLASSIFY ---
    assigned_module = DEFAULT_MODULE
    
    MODULE_RULES.each do |rule|
      if rule[:keywords].any? { |k| search_text.include?(k) }
        assigned_module = rule[:name]
        break
      end
    end

    class_lookup[class_name] = id

    # NOTE: We do NOT add Group Nodes here anymore. 
    # The frontend generates them automatically from the 'module' field below.

    nodes << {
      data: {
        id: id,
        label: class_name.demodulize,
        fullLabel: class_name,
        module: assigned_module,
        parent: "g_#{assigned_module}", # Frontend reads this to build the group
        weight: loc,
        complexity: loc > 100 ? 'high' : 'normal',
        archetype: archetype,
        isManual: true # Forces frontend to respect 'assigned_module'
      }
    }
  end
end

puts "✅ Indexing Complete. Processing #{nodes.count} nodes..."

# 2. DEPENDENCY PARSING
nodes.each do |node|
  # Skip processing if we somehow have a group node (safety check)
  next if node[:data][:isGroup] 

  file_path = nil
  PATH_CONFIG.keys.each do |base|
    potential = "#{base}/#{node[:data][:fullLabel].underscore}.rb"
    if File.exist?(potential)
      file_path = potential
      break
    end
  end
  
  next unless file_path

  begin
    content = File.read(file_path, mode: 'r:UTF-8', invalid: :replace, undef: :replace, replace: '')
    # Sanitization for Ruby 3.4 Parser
    content = content.gsub(/\\x[0-9a-fA-F]{2}/, '__') 

    ast = Parser::CurrentRuby.parse(content, file_path)
    next unless ast

    visitor = DependencyVisitor.new
    visitor.process(ast)

    # A. Inheritance
    if visitor.inheritance
      candidates = [
        visitor.inheritance,
        "#{node[:data][:fullLabel].deconstantize}::#{visitor.inheritance}"
      ]
      target_id = nil
      candidates.each { |c| target_id = class_lookup[c] if class_lookup[c] }

      if target_id && target_id != node[:data][:id]
        edges << { 
          data: { source: node[:data][:id], target: target_id, type: 'inheritance' } 
        }
      end
    end

    # B. Usage
    (visitor.dependencies + visitor.extensions).each do |const|
      next if IGNORE_LIST.include?(const)
      next if const == node[:data][:fullLabel]
      next if const == node[:data][:label]

      candidates = []
      current_namespace = node[:data][:fullLabel].deconstantize
      candidates << "#{current_namespace}::#{const}" unless current_namespace.empty?
      candidates << const

      target_id = nil
      candidates.each do |c| 
        if class_lookup[c]
          target_id = class_lookup[c] 
          break
        end
      end

      if target_id && target_id != node[:data][:id]
        # Prevent duplicates
        unless edges.any? { |e| e[:data][:source] == node[:data][:id] && e[:data][:target] == target_id }
          edges << { 
            data: { source: node[:data][:id], target: target_id, type: 'usage' } 
          }
        end
      end
    end

  rescue Parser::SyntaxError => e
    puts "⚠️  Skipping #{file_path}: Syntax Error"
  rescue StandardError => e
    puts "⚠️  Error processing #{file_path}: #{e.message}"
  end
end

# 3. EXPORT
output = { nodes: nodes, edges: edges }
File.write('architecture_map.json', JSON.pretty_generate(output))

puts "\n" + "="*40
puts "🚀 PROCESS COMPLETE"
puts "="*40
puts "Nodes : #{nodes.count}"
puts "Edges : #{edges.count}"
puts "Saved : architecture_map.json"
puts "="*40 + "\n"