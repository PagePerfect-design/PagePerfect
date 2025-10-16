# Quick Git Reference

## 🚀 Daily Commands

```bash
# Check status
git status

# Add all changes
git add .

# Commit with message
git commit -m "feat: your feature description"

# Push to remote
git push origin branch-name

# Pull latest changes
git pull origin branch-name
```

## 🌿 Branch Management

```bash
# Create and switch to new branch
git checkout -b feature/your-feature

# Switch to existing branch
git checkout branch-name

# List all branches
git branch -a

# Delete local branch
git branch -d branch-name
```

## 📝 Commit Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code formatting
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `test:` - Tests
- `chore:` - Maintenance

## 🔄 Workflow

1. `git checkout develop`
2. `git pull origin develop`
3. `git checkout -b feature/your-feature`
4. Make changes
5. `git add .`
6. `git commit -m "feat: description"`
7. `git push origin feature/your-feature`
8. Create Pull Request
