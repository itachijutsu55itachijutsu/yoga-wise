# Leafwise: how to use

1. site.json is already set (name, author, email, domain). Add adsenseId only after approval.
2. New article: add a file in /articles, e.g. monstera-care.md

   ---
   title: Monstera care
   description: One-line summary.
   date: 2026-12-10
   ---
   Intro paragraph.

   ## Heading

   Text. Image: ![Describe the photo](/images/monstera.webp)

3. Put photos in /images.
4. Push to GitHub. Vercel rebuilds automatically (vercel.json is included).
