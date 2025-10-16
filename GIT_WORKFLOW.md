# PagePerfect Git Workflow

This document outlines the Git workflow and conventions for the PagePerfect project.

## 🌿 Branch Structure

### Main Branches
- **`main`**: Production-ready code, always deployable
- **`develop`**: Integration branch for ongoing development

### Feature Branches
- **`feature/description`**: New features and enhancements
- **`bugfix/description`**: Bug fixes
- **`hotfix/description`**: Critical production fixes

## 📝 Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- **`feat`**: New feature
- **`fix`**: Bug fix
- **`docs`**: Documentation changes
- **`style`**: Code style changes (formatting, etc.)
- **`refactor`**: Code refactoring
- **`perf`**: Performance improvements
- **`test`**: Adding or updating tests
- **`chore`**: Maintenance tasks

### Examples
```bash
feat: implement Next.js Image component for logo optimization
fix: resolve favicon conflicts in production build
docs: update README with new installation steps
style: format code with Prettier
refactor: extract grid system into separate module
perf: optimize PDF generation with caching
test: add unit tests for template validation
chore: update dependencies to latest versions
```

## 🔄 Workflow Process

### 1. Starting New Work
```bash
# Switch to develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Making Changes
```bash
# Make your changes, then stage them
git add .

# Commit with descriptive message
git commit -m "feat: add new template selection UI"

# Push to remote
git push origin feature/your-feature-name
```

### 3. Creating Pull Requests
1. Create PR from feature branch to `develop`
2. Include detailed description of changes
3. Reference any related issues
4. Request code review from team members

### 4. Merging to Production
```bash
# After PR is approved and merged to develop
git checkout develop
git pull origin develop

# Create release branch (optional)
git checkout -b release/v1.2.0

# Merge to main when ready for production
git checkout main
git pull origin main
git merge develop
git tag v1.2.0
git push origin main --tags
```

## 🚫 What NOT to Commit

- `node_modules/` directories
- `.env` files with secrets
- Build artifacts (`dist/`, `.next/`, etc.)
- IDE-specific files (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)
- Log files (`*.log`)
- Temporary files (`*.tmp`, `tmp/`)

## 🔧 Useful Git Commands

### Daily Workflow
```bash
# Check status
git status

# See what changed
git diff

# See commit history
git log --oneline

# Switch branches
git checkout branch-name

# Create and switch to new branch
git checkout -b new-branch-name
```

### Cleanup
```bash
# Remove untracked files
git clean -fd

# Reset to last commit (destructive!)
git reset --hard HEAD

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

### Collaboration
```bash
# Fetch latest changes
git fetch origin

# Pull and merge
git pull origin branch-name

# Push to remote
git push origin branch-name

# Set upstream tracking
git push -u origin branch-name
```

## 📋 Pre-commit Checklist

Before committing, ensure:
- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] No console.log statements left in code
- [ ] Commit message follows convention
- [ ] No sensitive data in commit
- [ ] Changes are focused and atomic

## 🏷️ Tagging Releases

```bash
# Create annotated tag
git tag -a v1.2.0 -m "Release version 1.2.0"

# Push tags to remote
git push origin --tags

# List all tags
git tag -l
```

## 🔍 Code Review Guidelines

### For Reviewers
- Check code quality and style
- Verify functionality works as expected
- Ensure tests are adequate
- Look for potential security issues
- Confirm documentation is updated

### For Authors
- Keep PRs focused and small
- Include clear description of changes
- Add tests for new functionality
- Update documentation as needed
- Respond to feedback promptly

---

*This workflow ensures clean, maintainable code and smooth collaboration across the PagePerfect team.*
