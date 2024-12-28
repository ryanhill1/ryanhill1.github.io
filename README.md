# ryanhill1.github.io

Welcome to my personal website project. For local development, follow the instructions below.

## Prerequisites

Ensure you have the following installed:
- [Python](https://www.python.org/downloads/)
- [Node.js](https://nodejs.org/)

### Using Conda for Environment Management

You can create a virtual environment using Conda to manage dependencies for both Python and Node.js.

```bash
conda create -n rh1 python=3.12 nodejs=22

conda activate rh1
```

## Installation

After activating your environment, install the project dependencies by running:

```bash
npm install
```

## Serving the Site Locally

To preview the site locally, run the following command, which will serve the site at [http://localhost:8000](http://localhost:8000):

```bash
npm run dev
```

This will start a local server and automatically open your default web browser at the correct URL.

## Formatting Code

### JavaScript, HTML, and CSS

To format all project files (HTML, CSS, JS), run:

```bash
npm run format
```

To check formatting without making changes:

```bash
npm run format:check
```

### Python

For Python files, we use `tox` to manage formatting and linting. First, install tox:

```bash
pip install tox
```

To format Python files, run:

```bash
tox -e linters
```

To check Python formatting without making changes:

```bash
tox -e format-check
```

## Commit Messages

[Commitlint](https://github.com/conventional-changelog/commitlint/#what-is-commitlint) supported commit subjects list:

```
build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test
```

## Licenses

*Concept*:

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

*Source Code*:

[![GNU GPLv3](https://www.gnu.org/graphics/gplv3-88x31.png)](https://www.gnu.org/licenses/gpl-3.0.html)