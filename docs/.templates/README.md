# Documentation Templates

This directory contains reusable HTML templates for consistent documentation styling across the project.

## Available Templates

### Header Template (`header.html`)
- Animated gradient border effect
- Project branding and logo
- Quick navigation links
- Breadcrumb navigation
- CSS animations (gradient-shift, pulse, float)

### Footer Template (`footer.html`)
- Navigation grid with categorized links
- Social badges and project stats
- Animated "Back to Top" button
- Copyright and license information
- Version and disclaimer notice

## How to Use

### Option 1: Embed via iframe (GitHub Rendering Limitation)

GitHub markdown doesn't support iframes, but you can use them in self-hosted documentation:

```html
<!-- At the top of your .md file -->
<iframe src="./.templates/header.html" width="100%" height="200" frameborder="0"></iframe>

<!-- Your content here -->

<!-- At the bottom of your .md file -->
<iframe src="./.templates/footer.html" width="100%" height="400" frameborder="0"></iframe>
```

### Option 2: Direct HTML Inclusion (Recommended for GitHub)

Since GitHub markdown supports HTML, you can copy/paste the template content directly:

```markdown
<!-- Copy content from header.html here -->

# Your Documentation Title

Your content here...

<!-- Copy content from footer.html here -->
```

### Option 3: Automated Script

Use the provided script to inject headers/footers automatically:

```bash
# From project root
node scripts/inject-doc-templates.js docs/YOUR_DOC.md
```

## Customization

Each template includes:
- **Color scheme**: Purple/blue gradient (`#667eea`, `#764ba2`, `#4facfe`)
- **Animations**: CSS keyframe animations for visual appeal
- **Responsive design**: Works on different screen sizes
- **Accessibility**: Proper semantic HTML

To customize colors, edit the gradient values in the `<style>` sections.

## Template Features

### Animations

**gradient-shift**: Smooth color gradient animation on borders
```css
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

**pulse**: Subtle opacity pulsing effect
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

**float**: Gentle vertical floating motion
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}
```

## Style Guide

When creating new documentation:

1. **Start with header** - Provides navigation and branding
2. **Use consistent markdown** - Follow GitHub-flavored markdown
3. **Add breadcrumbs** - Help users understand location
4. **End with footer** - Provide additional navigation and resources
5. **Test links** - Ensure all cross-references work

## Maintenance

Templates are version-controlled and should be updated when:
- Project version changes
- Navigation structure changes
- Branding guidelines update
- New major features are added

Run link validation after updates:
```bash
npm run links:check:all
```

## Future Enhancements

Potential improvements:
- Dark mode support
- Theme switcher
- Language selector
- Search integration
- Analytics tracking
- Custom badges and shields

---

For questions or suggestions about templates, please open an issue.
