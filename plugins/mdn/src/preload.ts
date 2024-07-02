import * as path from 'path'
import matter from 'gray-matter'

const contentApiURL = "https://api.github.com/repos/mdn/content/contents";
const translatedContentApiURL = "https://api.github.com/repos/mdn/translated-content/contents";

const cleanupContent = (raw: string, res: any): string => {
  const file = matter(raw);

  let content = file.content;

  // Remove Ref tags
  content = content.replace(/{{\s?(cssref|MathML|JSRef)\s?}}/gim, "");

  // {{jsxref(“RegExp/n”, “RegExp.$1, …, RegExp.$9”)}}
  content = content.replace(/{{jsxref\("([^"]+)", "([^"]+)"\)}}/gim, "`$1`, `$2`");

  // Find all {{cssxref("...")}} and mreplace with just a name
  content = content.replace(/{{(cssxref|jsxref)\("([^"]+)"\)}}/gim, "`$2`");

  // {{js_property_attributes(1[,..])}} remove
  content = content.replace(/{{js_property_attributes\(\d+(,\s?\d+)*\)}}/gim, "");

  // Replace all samples
  content = content.replace(/{{Embed(Live|Interactive)(Sample|Example)\("([^"]+)"\)}}/gim, "`See page in browser`");

  // fix samples like {{EmbedLiveSample(“Complete_example”, 230, 250)}}
  content = content.replace(/{{EmbedLiveSample\("([^"]+)"(,\s?(\d+)){0,2}\)}}/gim, "`See sample - page in browser`");

  // fix samples like {{EmbedLiveSample(‘Comparing different length units’, ‘100%’, 700)}}
  content = content.replace(/{{EmbedLiveSample\("([^"]+)"(,\s?(\d+)){0,2}\)}}/gim, "`See sample - page in browser`");

  // {{EmbedInteractiveExample(...)}} - remove
  content = content.replace(/{{EmbedInteractiveExample\([^)]+\)}}/gim, "");

  // Replace all {{\s?Compat|Specifications\s?}} tags with a reference to See page in browser
  content = content.replace(/{{\s?(Compat|Specifications|cssinfo|csssyntax)\s?}}/gim, "`See page in browser`");

  // Replace all {{\s?Non-standard_header\s?}} tags with a message that it's non-standard
  content = content.replace(/{{\s?Non-standard_header\s?}}/gim, "`Non-standard` ");

  // Replace all {{\s?Deprecated_header\s?}} tags with a message that it's deprecated
  content = content.replace(/{{\s?Deprecated_header\s?}}/gim, "`Deprecated` ");

  // Deprecated inline {{deprecated_inline}}
  content = content.replace(/{{\s?deprecated_inline\s?}}/gim, "`deprecated` ");

  // Remove Sidebar tags
  content = content.replace(/{{(\w+)?Sidebar(\("([^"]+)"\))?}}/gim, "");

  // Find all links and replace the href with the full url
  content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, (match, text, href) => {
    let url = href;
    if (href.startsWith("http")) {
      return match;
    }
    if (!href.startsWith("/")) {
      url = path.join(res.url, href);
    } else {
      url = path.join(new URL(res.url).origin, href);
    }
    return `[${text}](${url})`;
  });

  if (file.data.title) {
    content = `# ${file.data.title}\n\n${content}`;
  }

  return content;
};

const getContent = async (item) => {
  const file =
    "/files" +
    item.mdn_url.toLowerCase().replace("::", "_doublecolon_").replace(":", "_colon_").replace("/docs/", "/") +
    "/index.md";
  const url = `${translatedContentApiURL}${file}`;
  const response = await window.publicApp.fetch(url)
  const json = JSON.parse(response.text)
  const content = Buffer.from(json?.content ?? "", (json?.encoding ?? "base64") as BufferEncoding).toString()
  
  const div = document.createElement('markdown-render')
  div.style.paddingRight = '12px'
  // @ts-ignore
  div.setAttribute('content', cleanupContent(content || '获取详情信息失败', item))
  return div
} 
 
 
 
export default {
  search: window.publicApp.utils.debounce(async (keyword, setList) => {
    const url = new URL('https://developer.mozilla.org/api/v1/search')
    url.searchParams.set('q', keyword)
    url.searchParams.set('sort', 'best')
    url.searchParams.set('locale', 'zh-CN')
    const response = await window.publicApp.fetch(url.href)
    const docs = (JSON.parse(response.text).documents || []).map(doc => ({
      title: doc.title,
      subtitle: doc.summary,
      icon: 'https://developer.mozilla.org/apple-touch-icon.6803c6f0.png',
      url: `https://developer.mozilla.org${doc.mdn_url}`,
      mdn_url: doc.mdn_url
    }))
    return setList(docs)
  }),
  select(item) {
    return getContent(item)
  },
  enter(item) {
    require('electron').shell.openExternal(item.url)
  }
}