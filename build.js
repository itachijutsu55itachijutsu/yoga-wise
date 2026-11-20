// Zero-dependency static site builder. Run: node build.js  -> output in /dist
const fs=require('fs'),path=require('path');
const site=JSON.parse(fs.readFileSync('site.json','utf8'));
const OUT='dist';
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
const inline=s=>esc(s)
 .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1" loading="lazy">')
 .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>')
 .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
function md(t){return t.trim().split(/\n\s*\n/).map(b=>{b=b.trim();
 const ph=b.match(/^\[IMAGE: (.+)\]$/);if(ph)return '<div class="img-ph">Image placeholder: '+esc(ph[1])+'</div>';
 if(b.startsWith('## '))return '<h2>'+inline(b.slice(3))+'</h2>';
 if(b.startsWith('### '))return '<h3>'+inline(b.slice(4))+'</h3>';
 if(/^\d+\. /.test(b))return '<ol>'+b.split('\n').map(l=>'<li>'+inline(l.replace(/^\d+\. /,''))+'</li>').join('')+'</ol>';
 if(/^- /.test(b))return '<ul>'+b.split('\n').map(l=>'<li>'+inline(l.replace(/^- /,''))+'</li>').join('')+'</ul>';
 return '<p>'+inline(b.replace(/\n/g,' '))+'</p>';}).join('\n');}
function read(file){let raw=fs.readFileSync(file,'utf8').replace(/\{\{email\}\}/g,site.email).replace(/\{\{name\}\}/g,site.name).replace(/\{\{author\}\}/g,site.author);
 const m=raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);const meta={};let body=raw;
 if(m){m[1].split('\n').forEach(l=>{const i=l.indexOf(':');if(i>0)meta[l.slice(0,i).trim()]=l.slice(i+1).trim()});body=m[2];}
 return {meta,body,slug:path.basename(file,'.md')};}
const list=d=>fs.existsSync(d)?fs.readdirSync(d).filter(f=>f.endsWith('.md')).map(f=>read(path.join(d,f))):[];
const articles=list('articles').sort((a,b)=>(b.meta.date||'').localeCompare(a.meta.date||''));
const pages=list('pages');
const css=fs.readFileSync('style.css','utf8');
const ad=site.adsenseId?`<meta name="google-adsense-account" content="${site.adsenseId}"><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${site.adsenseId}" crossorigin="anonymous"></script>`:'';
function layout(title,desc,url,body){return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${site.domain}${url}"><link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${site.emoji||'🪴'}</text></svg>"><link rel="stylesheet" href="/style.css">${ad}</head><body><header><a class="logo" href="/">${site.emoji||'🪴'} ${esc(site.name)}</a><nav><a href="/">Home</a><a href="/guides/">Guides</a><a href="/about/">About</a><a href="/contact/">Contact</a></nav></header><main>${body}</main><footer><a href="/about/">About</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><p>© ${new Date().getFullYear()} ${esc(site.name)}. ${esc(site.disclaimer||'')}</p></footer></body></html>`;}
function write(url,html){const p=path.join(OUT,url,'index.html');fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,html);}
const card=a=>`<div class="card"><h3><a href="/${a.slug}/">${esc(a.meta.title)}</a></h3><p class="meta">${esc(a.meta.description||'')}</p></div>`;
write('',layout(`${site.name}: ${site.tagline}`,site.tagline,'/',`<h1>${esc(site.tagline)}</h1><p class="lead">${esc(site.intro||'')}</p><h2>Latest guides</h2>${articles.slice(0,6).map(card).join('')}<p><a href="/guides/">See all guides →</a></p>`));
write('guides',layout(`All guides | ${site.name}`,'All guides','/guides/',`<h1>All guides</h1>${articles.map(card).join('')}`));
articles.forEach(a=>{const rel=articles.filter(x=>x!==a).slice(0,3).map(card).join('');
 write(a.slug,layout(`${a.meta.title} | ${site.name}`,a.meta.description||'',`/${a.slug}/`,`<article><h1>${esc(a.meta.title)}</h1><p class="meta">By ${esc(site.author)} · Updated ${esc(a.meta.date||'')}</p>${md(a.body)}</article><h2>Keep reading</h2>${rel}`));});
pages.forEach(p=>write(p.slug,layout(`${p.meta.title} | ${site.name}`,p.meta.description||p.meta.title,`/${p.slug}/`,`<h1>${esc(p.meta.title)}</h1>${md(p.body)}`)));
const urls=['/','/guides/',...articles.map(a=>`/${a.slug}/`),...pages.map(p=>`/${p.slug}/`)];
fs.writeFileSync(path.join(OUT,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${site.domain}${u}</loc></url>`).join('')}</urlset>`);
fs.writeFileSync(path.join(OUT,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${site.domain}/sitemap.xml\n`);
if(site.adsenseId)fs.writeFileSync(path.join(OUT,'ads.txt'),`google.com, ${site.adsenseId.replace('ca-','')}, DIRECT, f08c47fec0942fa0\n`);
fs.writeFileSync(path.join(OUT,'style.css'),css);
if(fs.existsSync('images'))fs.cpSync('images',path.join(OUT,'images'),{recursive:true});
console.log(`Built ${articles.length} articles, ${pages.length} pages.`);
