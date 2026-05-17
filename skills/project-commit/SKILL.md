---
name: project-commit
description: Commits all changes in the current branch with an automatically generated, meaningful commit message based on staged or unstaged changes. Use this skill when you need to commit local changes and want an AI-assisted commit message without emojis.
---

# Project Commit

## Overview

This skill automates the process of committing local changes in your Git repository. It generates a concise and meaningful commit message by analyzing the differences in your staged files, or falling back to all changes if no files are staged. The generated commit message will not contain emojis.

## Usage

When activated, this skill will perform the following steps:
1.  Check for staged changes using `git diff --staged`.
2.  If staged changes are found, it will analyze them to generate a commit message.
3.  If no staged changes are found, it will then check for unstaged changes using `git diff` and analyze those to generate a commit message.
4.  It will then execute `git commit -m "Your Generated Commit Message"`.

## Resources

### scripts/commit_changes.js
This script contains the core logic for detecting changes, generating the commit message, and executing the git commit command.

---

**Note:** The 'assets/' and 'references/' directories have been removed as they are not required for this skill.
