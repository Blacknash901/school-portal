# Contributing to CECRE Portal & Monitoring System

Thank you for your interest in contributing to the CECRE Portal & Monitoring System! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- Be respectful and constructive in your communication
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what's best for the community and project

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- Node.js 18+ and npm installed
- Docker and Docker Compose
- Git for version control
- A GitHub account

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/school-portal.git
cd school-portal
```

3. Add the upstream repository:

```bash
git remote add upstream https://github.com/Blacknash901/school-portal.git
```

4. Create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
```

## 💻 Development Workflow

### Portal App Development

1. Install dependencies:

```bash
cd portal-app
npm install
```

2. Copy environment variables:

```bash
cp env.example .env
# Edit .env with your configuration
```

3. Start the development server:

```bash
npm start
```

### Monitor App Development

1. Install dependencies:

```bash
cd monitor-app
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. The app will be available at `http://localhost:5173`

### Infrastructure Testing

To test infrastructure changes locally:

```bash
cd infrastructure/terraform
terraform init
terraform plan
```

**Note:** Do not apply Terraform changes without approval from maintainers.

## 📤 Submitting Changes

### Pull Request Process

1. **Ensure your code follows our coding standards** (see below)

2. **Update documentation** if you're changing functionality

3. **Add or update tests** for new features

4. **Commit your changes** with clear, descriptive messages:

```bash
git add .
git commit -m "feat: add user notification system"
```

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

5. **Push to your fork:**

```bash
git push origin feature/your-feature-name
```

6. **Create a Pull Request** on GitHub:
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - Wait for review and address feedback

### Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Include tests for new functionality
- Update relevant documentation
- Ensure CI/CD checks pass
- Request review from at least one maintainer

## 📝 Coding Standards

### JavaScript/React

- Use ES6+ syntax
- Follow functional programming patterns
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep components small and focused

Example:

```javascript
/**
 * Fetches user profile from Azure AD
 * @param {string} userId - The user's unique identifier
 * @returns {Promise<Object>} User profile object
 */
async function fetchUserProfile(userId) {
  // Implementation
}
```

### File Organization

- Group related files together
- Use index.js for module exports
- Keep file names descriptive and lowercase with hyphens

### CSS/Styling

- Use CSS modules or styled-components
- Follow BEM naming convention for classes
- Ensure responsive design (mobile-first)

## 🧪 Testing Guidelines

### Running Tests

```bash
# Portal app
cd portal-app
npm test

# Monitor app
cd monitor-app
npm test
```

### Test Requirements

- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for critical user flows
- Maintain > 80% code coverage

### Writing Tests

```javascript
describe("UserProfile Component", () => {
  it("should render user name correctly", () => {
    // Test implementation
  });
});
```

## 📚 Documentation

### Code Documentation

- Add comments for complex logic
- Use JSDoc for function documentation
- Update README.md for feature changes
- Add examples for new APIs

### Documentation Structure

```
docs/
├── guides/           # How-to guides
├── reference/        # Technical reference
└── archived/         # Historical documentation
```

### Adding Documentation

1. Create markdown files in appropriate `docs/` subdirectory
2. Use clear headings and examples
3. Include screenshots where helpful
4. Link from main README if relevant

## 🔧 Infrastructure Changes

### Terraform

- Run `terraform fmt` before committing
- Add comments explaining resource purposes
- Use variables for configurable values
- Test in a separate environment first

### Ansible

- Use meaningful playbook and task names
- Add comments for complex tasks
- Test playbooks in development before production
- Follow YAML best practices

### Kubernetes

- Use appropriate resource limits
- Add labels for organization
- Include health checks
- Document custom configurations

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Verify it's reproducible
3. Test with latest version

### Bug Report Template

```markdown
**Description:**
Clear description of the bug

**Steps to Reproduce:**

1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**

- OS: [e.g., Ubuntu 22.04]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.2.3]

**Screenshots:**
If applicable
```

## 💡 Feature Requests

We welcome feature requests! Please:

1. Check existing issues first
2. Describe the problem you're solving
3. Explain your proposed solution
4. Consider implementation complexity
5. Be open to feedback and alternatives

## 🎯 Development Priorities

Current focus areas:

1. Improving monitoring capabilities
2. Enhancing security features
3. Performance optimization
4. Mobile experience
5. Documentation improvements

## 📞 Getting Help

- **Questions:** Open a GitHub Discussion
- **Bugs:** Create an issue with bug template
- **Security:** Email security@cecre.net (do not open public issues)
- **General:** Join our Discord/Slack (if available)

## 🙏 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes for significant contributions
- GitHub contributor graphs

Thank you for contributing to make this project better! 🚀
