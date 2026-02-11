require 'json'
require 'set'
require 'active_support/all'
require 'parser/current' # Requires: gem install parser

# --- CONFIGURATION ---
STRUCTURE = {
  'app/models'      => { module: 'Core',        color: '#0984e3' },
  'app/services'    => { module: 'Services',    color: '#00b894' },
  'app/controllers' => { module: 'Controllers', color: '#6c5ce7' },
  'app/jobs'        => { module: 'Background',  color: '#fab1a0' },
  'app/mailers'     => { module: 'Comm',        color: '#fdcb6e' },
  'lib'             => { module: 'Libs',        color: '#e17055' }
}

# Ignore common Ruby/Rails internals
IGNORE_LIST = Set.new(%w[
  String Integer Array Hash Boolean Date DateTime Time File Dir
  ApplicationRecord ApplicationController ActiveJob::Base StandardError
  Rails ActiveRecord ActiveSupport
])

# --- AST PROCESSOR ---
# This class walks the code tree to find real dependencies
class DependencyVisitor < Parser::AST::Processor
  attr_reader :dependencies, :inheritance, :extensions

  def initialize
    @dependencies = Set.new
    @inheritance = nil
    @extensions = Set.new
  end

  # Hook: When a class is defined (class User < ApplicationRecord)
  def on_class(node)
    _name_node, superclass_node, _body_node = *node
    
    # 1. Capture Inheritance
    if superclass_node
      parent_name = unpack_const(superclass_node)
      @inheritance = parent_name if parent_name
    end

    super # Continue traversing the body
  end

  # Hook: When a constant is used (User.new, Admin::Post.find)
  def on_const(node)
    name = unpack_const(node)
    @dependencies.add(name) if name
    super
  end

  # Hook: Detect include/extend (module mixins)
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

  # Recursively unpacks (const (const nil :Admin) :User) -> "Admin::User"
  def unpack_const(node)
    return nil unless node.is_a?(Parser::AST::Node) && node.type == :const
    
    scope, name = *node
    if scope
      parent = unpack_const(scope)
      parent ? "#{parent}::#{name}" : "::#{name}" # Handle global scope ::User
    else
      name.to_s
    end
  end
end

nodes = []
edges = []
class_lookup = {} # Maps "Admin::User" -> "app_models_admin_user" (ID)

puts "🔍 Scanning codebase with AST Parser..."

# ---------------------------------------------------------
# 1. SMART NODE GENERATION (Same as before)
# ---------------------------------------------------------
STRUCTURE.each do |base_path, config|
  next unless Dir.exist?(base_path)

  Dir.glob("#{base_path}/**/*.rb").each do |file_path|
    content = File.read(file_path)
    
    # Weight: Count Non-Comment Lines of Code
    loc = content.lines.count { |line| !line.strip.empty? && !line.strip.start_with?('#') }
    
    # Naming: app/models/admin/user.rb -> Admin::User
    relative_path = file_path.sub("#{base_path}/", '').sub('.rb', '')
    class_name = relative_path.camelize 
    
    # ID: admin_user
    id = class_name.underscore.gsub('/', '_')

    class_lookup[class_name] = id
    
    complexity = loc > 100 ? 'high' : 'normal'

    nodes << {
      data: {
        id: id,
        label: class_name.demodulize,
        fullLabel: class_name,
        module: config[:module],
        weight: loc,
        complexity: complexity,
        archetype: config[:module].singularize
      }
    }
  end
end

puts "✅ Indexing Complete. Found #{nodes.count} definitions."

# ---------------------------------------------------------
# 2. AST-BASED DEPENDENCY PARSING
# ---------------------------------------------------------
nodes.each do |node|
  # Resolve file path
  file_path = nil
  STRUCTURE.keys.each do |base|
    potential = "#{base}/#{node[:data][:fullLabel].underscore}.rb"
    if File.exist?(potential)
      file_path = potential
      break
    end
  end
  
  next unless file_path

  begin
    # PARSE THE FILE INTO AST
    buffer = Parser::Source::Buffer.new(file_path)
    buffer.source = File.read(file_path)
    ast = Parser::CurrentRuby.parse(buffer)
    
    next unless ast # Skip empty files

    # WALK THE AST
    visitor = DependencyVisitor.new
    visitor.process(ast)

    # A. HANDLE INHERITANCE (Strong Link)
    if visitor.inheritance
      candidates = [
        visitor.inheritance,
        "#{node[:data][:fullLabel].deconstantize}::#{visitor.inheritance}"
      ]
      
      target_id = nil
      candidates.each { |c| target_id = class_lookup[c] if class_lookup[c] }

      if target_id && target_id != node[:data][:id]
        edges << { 
          data: { 
            source: node[:data][:id], 
            target: target_id, 
            type: 'inheritance' 
          } 
        }
      end
    end

    # B. HANDLE USAGE & EXTENSIONS (Weak Links)
    # Merge regular deps and mixins
    all_deps = visitor.dependencies + visitor.extensions
    
    all_deps.each do |const|
      next if IGNORE_LIST.include?(const)
      next if const == node[:data][:fullLabel] # Don't link self
      next if const == node[:data][:label]     # Don't link self (short name)

      # Namespace Resolution Strategy
      candidates = []
      current_namespace = node[:data][:fullLabel].deconstantize
      
      # 1. Try local scope (e.g. inside Admin::User, 'Post' -> Admin::Post)
      candidates << "#{current_namespace}::#{const}" unless current_namespace.empty?
      # 2. Try global scope
      candidates << const

      target_id = nil
      candidates.each do |c| 
        if class_lookup[c]
          target_id = class_lookup[c] 
          break
        end
      end

      # Create Edge if Valid
      if target_id && target_id != node[:data][:id]
        # Avoid duplicate edges
        unless edges.any? { |e| e[:data][:source] == node[:data][:id] && e[:data][:target] == target_id }
          edges << { 
            data: { 
              source: node[:data][:id], 
              target: target_id, 
              type: 'usage' 
            } 
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

puts "🚀 AST Analysis Complete!"
puts "   Nodes: #{nodes.count}"
puts "   Edges: #{edges.count}"
puts "   Saved to: architecture_map.json"