require 'json'
require 'set'
require 'active_support/all' # Critical for accurate naming

# --- CONFIGURATION ---
STRUCTURE = {
  'app/models'      => { module: 'Core',        color: '#0984e3' },
  'app/services'    => { module: 'Services',    color: '#00b894' },
  'app/controllers' => { module: 'Controllers', color: '#6c5ce7' },
  'app/jobs'        => { module: 'Background',  color: '#fab1a0' },
  'app/mailers'     => { module: 'Comm',        color: '#fdcb6e' },
  'lib'             => { module: 'Libs',        color: '#e17055' }
}

# Standard Ruby classes to ignore to reduce noise
IGNORE_LIST = Set.new(%w[
  String Integer Array Hash Boolean Date DateTime Time File Dir
  ApplicationRecord ApplicationController ActiveJob::Base StandardError
  Rails ActiveRecord
])

nodes = []
edges = []
class_lookup = {} # Maps "Admin::User" -> "app_models_admin_user"

puts "🔍 Scanning codebase with Enhanced Accuracy..."

# ---------------------------------------------------------
# 1. SMART NODE GENERATION
# ---------------------------------------------------------
STRUCTURE.each do |base_path, config|
  next unless Dir.exist?(base_path)

  Dir.glob("#{base_path}/**/*.rb").each do |file_path|
    # A. Calculate "Weight" (Complexity)
    # We count characters instead of just lines for better granularity
    content = File.read(file_path)
    loc = content.lines.count { |line| !line.strip.empty? && !line.strip.start_with?('#') }
    
    # B. Accurate Naming via ActiveSupport
    # app/models/admin/user.rb -> Admin::User
    relative_path = file_path.sub("#{base_path}/", '').sub('.rb', '')
    class_name = relative_path.camelize 
    
    # C. Unique ID generation
    id = class_name.underscore.gsub('/', '_')

    # Store metadata
    class_lookup[class_name] = id
    
    # Check for High Complexity (Arbitrary threshold > 100 LOC)
    complexity = loc > 100 ? 'high' : 'normal'

    nodes << {
      data: {
        id: id,
        label: class_name.demodulize, # Shows "User" instead of "Admin::User"
        fullLabel: class_name,        # Searchable full name
        module: config[:module],
        weight: loc,
        complexity: complexity,
        archetype: config[:module].singularize # Used for your filters
      }
    }
  end
end

puts "✅ Indexing Complete. Found #{nodes.count} definitions."

# ---------------------------------------------------------
# 2. INTELLIGENT DEPENDENCY PARSING
# ---------------------------------------------------------
nodes.each do |node|
  # Resolve file path from ID back to file system
  # (In a real enterprise parser, we'd store file_path in node data, but logic here works)
  file_path = nil
  STRUCTURE.keys.each do |base|
    potential = "#{base}/#{node[:data][:fullLabel].underscore}.rb"
    if File.exist?(potential)
      file_path = potential
      break
    end
  end
  
  next unless file_path

  # READ FILE & STRIP NOISE
  # We remove comments (#) and Strings ("...") to avoid false positives
  raw_content = File.read(file_path)
  clean_content = raw_content.gsub(/#.*$/, '')       # Remove comments
                             .gsub(/".*?"/, '')      # Remove double quotes
                             .gsub(/'.*?'/, '')      # Remove single quotes

  # A. INHERITANCE DETECTION (Strongest Link)
  # Looks for: class User < ApplicationRecord
  if match = clean_content.match(/class\s+#{node[:data][:label]}\s*<\s*([A-Z][a-zA-Z0-9:]*)/)
    parent_class = match[1]
    
    # Handle namespacing logic for parent
    # If Admin::User inherits from "Base", it might be "Admin::Base"
    candidates = [parent_class, "#{node[:data][:fullLabel].deconstantize}::#{parent_class}"]
    
    target_id = nil
    candidates.each { |c| target_id = class_lookup[c] if class_lookup[c] }

    if target_id
      edges << { 
        data: { 
          source: node[:data][:id], 
          target: target_id, 
          type: 'inheritance' # Visualized as thick line
        } 
      }
    end
  end

  # B. CONSTANT SCANNING (Usage)
  # Find all Capitalized words that are known classes
  potential_deps = clean_content.scan(/\b([A-Z][a-zA-Z0-9:]*)\b/).flatten.uniq
  
  potential_deps.each do |const|
    next if IGNORE_LIST.include?(const)
    next if const == node[:data][:label] # Don't link to self

    # Attempt to resolve namespace (Current namespace first, then global)
    current_namespace = node[:data][:fullLabel].deconstantize
    candidates = []
    
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
      # Check if edge already exists (avoid duplicates)
      unless edges.any? { |e| e[:data][:source] == node[:data][:id] && e[:data][:target] == target_id }
        edges << { 
          data: { 
            source: node[:data][:id], 
            target: target_id, 
            type: 'usage' # Visualized as thin/dashed line
          } 
        }
      end
    end
  end
end

# 3. EXPORT
output = { nodes: nodes, edges: edges }
File.write('architecture_map.json', JSON.pretty_generate(output))

puts "🚀 Analysis Complete!"
puts "   Nodes: #{nodes.count}"
puts "   Edges: #{edges.count}"
puts "   Saved to: architecture_map.json"