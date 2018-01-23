xml.instruct!
xml.urlset 'xmlns' => 'http://www.sitemaps.org/schemas/sitemap/0.9' do
  sitemap.resources.find_all{|p| p.source_file.match(/\.html/)}.reject{|p| p.source_file.match(/(error\.html\.erb|tag\.html\.erb|calendar\.html\.erb)/)}.each do |page|
    xml.url do
      xml.loc "https://parthkolekar.me/#{page.destination_path.gsub('index.html', '')}"
      xml.lastmod File.mtime(page.source_file).iso8601
      xml.changefreq 'weekly'
      xml.priority !(defined?(page.data.priority)).nil? ? page.data.priority : '0.5'
    end
  end
end
