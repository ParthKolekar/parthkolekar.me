set :layout, false

# Auto Prefix
activate :autoprefixer do |prefix|
  prefix.browsers = "last 2 versions"
end

data.errors.each do |e|
  proxy "error/#{e[:code]}.html", "error.html", :locals => {
    :status_code => e[:code],
    :short => e[:short],
    :long => e[:long],
    :urlobtainer => e[:urlobtainer]
  },
  :ignore => true
end

# Syntax highlight
activate :syntax

# kramdown is pretty cool
set :markdown_engine, :kramdown

# Za Blogz
activate :blog do |blog|
  blog.prefix = "blog"
  blog.name = "blog"

  # blog.permalink = "{year}/{month}/{day}/{title}.html"
  # Matcher for blog source files
  # blog.sources = "{year}-{month}-{day}-{title}.html"
  # blog.taglink = "tags/{tag}.html"
  # blog.layout = "layout"
  # blog.summary_separator = /(READMORE)/
  # blog.summary_length = 250
  # blog.year_link = "{year}.html"
  # blog.month_link = "{year}/{month}.html"
  # blog.day_link = "{year}/{month}/{day}.html"
  # blog.default_extension = ".markdown"

  blog.tag_template = "blog/tag.html"
  blog.calendar_template = "blog/calendar.html"

  # Enable pagination
  blog.paginate = true
  blog.per_page = 10
  blog.page_link = "page/{num}"
end

# Reload the browser automatically whenever files change
configure :development do
  activate :livereload
end

# Methods defined in the helpers block are available in templates
helpers do
  def featured
    blog.articles.select{|page| page.data.featured rescue false}.sort_by{|page| page.date}.reverse
  end

  def is_featured(page)
    !(defined?(page.data.featured)).nil?
  end

  def is_unfeatured(page)
    !(defined?(page.data.unfeatured)).nil?
  end

  def related(page)
    related_pages = blog.tags.slice(*page.tags).values.first || []
    related_pages.concat featured
    related_pages.delete_if { |p| p == page }
    related_pages.delete_if { |p| is_unfeatured(p) }
    related_pages.shuffle
  end
end

# Build-specific configuration
configure :build do
  # Minify CSS on build
  activate :minify_css

  # Minify Javascript on build
  activate :minify_javascript
end

# After doing all the things, hash them
# Disabled. I don't need to cache bust because
# things change so slowly
# activate :asset_hash

# Make things pretty (Must be Last Activation)
activate :directory_indexes
