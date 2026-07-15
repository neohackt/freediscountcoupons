export interface StoreSection {
  title: string;
  content: string;
}

export function parseStoreSections(html: string): StoreSection[] {
  if (!html) return [];

  const sections: StoreSection[] = [];

  // Split on <h2> opening tags
  const parts = html.split(/(<h2[^>]*>)/i);

  let introContent = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (/<h2[^>]*>/i.test(part)) {
      // Next part contains the title text + </h2> closing tag + the section content
      const rawPart = parts[i + 1] || '';

      // Split at the first </h2> to separate title from content
      const h2CloseIdx = rawPart.indexOf('</h2>');
      let title: string;
      let content: string;

      if (h2CloseIdx !== -1) {
        title = rawPart.substring(0, h2CloseIdx).replace(/<[^>]+>/g, '').trim();
        content = rawPart.substring(h2CloseIdx + 5); // 5 = '</h2>'.length
      } else {
        // No closing tag found — treat entire rawPart as title
        title = rawPart.replace(/<[^>]+>/g, '').trim();
        content = parts[i + 2] || '';
      }

      sections.push({ title, content });
      i += 1; // only skip 1 since we consumed the content from the rawPart
    } else {
      // This is content before the first <h2> (intro)
      introContent = part;
    }
  }

  // If there are sections, prepend intro content to the first section
  if (sections.length > 0 && introContent.trim()) {
    sections[0].content = introContent + sections[0].content;
  }

  // If no h2 tags found, try h3 as fallback
  if (sections.length === 0 && html.trim()) {
    const h3Parts = html.split(/(<h3[^>]*>)/i);
    let h3Intro = '';

    for (let i = 0; i < h3Parts.length; i++) {
      const part = h3Parts[i];
      if (/<h3[^>]*>/i.test(part)) {
        const rawPart = h3Parts[i + 1] || '';
        const h3CloseIdx = rawPart.indexOf('</h3>');
        let title: string;
        let content: string;

        if (h3CloseIdx !== -1) {
          title = rawPart.substring(0, h3CloseIdx).replace(/<[^>]+>/g, '').trim();
          content = rawPart.substring(h3CloseIdx + 4);
        } else {
          title = rawPart.replace(/<[^>]+>/g, '').trim();
          content = h3Parts[i + 2] || '';
        }

        sections.push({ title, content });
        i += 1;
      } else {
        h3Intro = part;
      }
    }

    if (sections.length > 0 && h3Intro.trim()) {
      sections[0].content = h3Intro + sections[0].content;
    }

    if (sections.length === 0) {
      sections.push({ title: '', content: html });
    }
  }

  return sections;
}
