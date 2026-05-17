---
name: project-commit
description: Commits all changes in the current branch with an automatically generated, meaningful commit message and pushes them to origin/{branchName}. Use this skill when you want an AI-assisted commit message and immediate push to a specific branch.
---

# Project Commit

## Overview

This skill automates the process of committing and pushing local changes in your Git repository. It generates a concise and meaningful commit message by analyzing differences, stages all changes, commits them without emojis, and then pushes to the specified branch on origin.

## Usage

When activated, this skill will perform the following steps:
1.  **Require a `branchName` argument.**
2.  Check for staged or unstaged changes.
3.  Analyze changes to generate a meaningful commit message.
4.  Execute `git add .`.
5.  Execute `git commit -m "Your Generated Commit Message"`.
6.  Execute `git push origin {branchName}`.

### Example
`Use the project-commit skill for the master branch` -> This triggers the skill with `branchName="master"`.

## Resources

### scripts/commit_changes.js
This script contains the core logic for detecting changes, generating the commit message, committing, and pushing to the remote repository.
