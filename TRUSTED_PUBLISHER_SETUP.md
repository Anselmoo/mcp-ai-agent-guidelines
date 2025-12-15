# NPM Trusted Publisher Setup Guide

This repository now uses [NPM Trusted Publishers](https://docs.npmjs.com/trusted-publishers) for secure, token-free publishing to the npm registry.

## What Changed

### Workflow Updates (`.github/workflows/ci-cd.yml`)
1. ✅ Added npm update step to ensure npm 11.5.1 or later
2. ✅ Removed `NODE_AUTH_TOKEN` secret requirement
3. ✅ Configured OIDC authentication via `id-token: write` permission

### Benefits
- **No tokens required**: No need to manage NPM_TOKEN secret
- **Enhanced security**: Uses short-lived OIDC tokens instead of long-lived API tokens
- **Better audit trail**: All publishing actions tied to GitHub identity
- **Simplified maintenance**: One less secret to rotate and secure

## Required Setup on npmjs.com

**⚠️ IMPORTANT**: The package maintainer must configure trusted publisher on npmjs.com before the workflow will work.

### Steps to Configure on npmjs.com

1. **Log in to npmjs.com** with your account that has publish permissions for `mcp-ai-agent-guidelines`

2. **Navigate to Package Settings**
   - Go to https://www.npmjs.com/package/mcp-ai-agent-guidelines
   - Click "Settings" tab

3. **Add Trusted Publisher**
   - Scroll to "Publishing access" section
   - Click "Add trusted publisher"
   - Select "GitHub Actions" as the provider

4. **Configure GitHub Details**
   - **Repository owner**: `Anselmoo`
   - **Repository name**: `mcp-ai-agent-guidelines`
   - **Workflow file**: `.github/workflows/ci-cd.yml`
   - **Job name**: `publish-npm`
   - **Environment**: `npm` (optional, but matches our workflow)

5. **Save Configuration**
   - Review the details
   - Click "Add trusted publisher"

### Verification

After setup, test the configuration:

1. **Create a test tag** (or wait for next release):
   ```bash
   git tag -a v0.12.2-test -m "Test trusted publisher"
   git push origin v0.12.2-test
   ```

2. **Monitor the workflow**:
   - Go to https://github.com/Anselmoo/mcp-ai-agent-guidelines/actions
   - Watch the `publish-npm` job
   - Should complete without requiring NPM_TOKEN

3. **If it fails**, check:
   - Trusted publisher is configured correctly on npmjs.com
   - npm version is 11.5.1 or later (workflow ensures this)
   - OIDC token has proper permissions (workflow sets `id-token: write`)

## Technical Details

### How It Works

1. GitHub Actions generates a short-lived OIDC token with claims about:
   - Repository owner and name
   - Workflow file path
   - Job name
   - Environment (if specified)

2. When `npm publish` runs:
   - npm 11.5.1+ detects the OIDC token from GitHub Actions
   - Sends token to npm registry for validation
   - npm validates the token against trusted publisher configuration
   - If match found, allows publish without API token

3. Authentication is automatic - no explicit configuration needed in workflow

### Security Considerations

- **Token scope**: OIDC tokens are short-lived (typically 1 hour)
- **Claims verification**: npm verifies repository, workflow, and job match configuration
- **Audit trail**: All publishes logged with GitHub identity
- **No secret exposure**: No long-lived tokens stored in repository secrets

### Migration from NPM_TOKEN

If you previously had `NPM_TOKEN` configured:

1. ✅ The workflow no longer references it
2. ✅ You can safely remove `NPM_TOKEN` from repository secrets
3. ⚠️ Keep it as backup until trusted publisher is verified working
4. ✅ After successful test publish, delete the token from:
   - GitHub repository secrets
   - npmjs.com user settings (revoke the token)

## Troubleshooting

### Error: "OIDC token authentication failed"
- **Cause**: Trusted publisher not configured on npmjs.com
- **Fix**: Follow setup steps above

### Error: "npm ERR! 401 Unauthorized"
- **Cause**: Workflow details don't match trusted publisher configuration
- **Fix**: Verify repository owner, name, workflow file, and job name match exactly

### Error: "This version of npm does not support trusted publishers"
- **Cause**: npm version is older than 11.5.1
- **Fix**: Already handled by workflow's npm update step, but verify step completed

### Workflow succeeds but package not published
- **Cause**: Multiple possible issues
- **Fix**: Check workflow logs for npm publish output, verify npmjs.com permissions

## References

- [NPM Trusted Publishers Documentation](https://docs.npmjs.com/trusted-publishers)
- [GitHub OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [npm publish CLI reference](https://docs.npmjs.com/cli/v10/commands/npm-publish)

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review workflow logs in GitHub Actions
3. Consult npm's trusted publisher documentation
4. Open an issue if problem persists

---

**Last Updated**: 2025-12-15
**Workflow Version**: ci-cd.yml (with trusted publisher support)
