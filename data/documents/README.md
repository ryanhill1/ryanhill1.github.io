# Documents Directory

Place your documents here for embedding generation.

## Required Files

- `cv.txt` - Your CV/resume as plain text
- `about.txt` - About information (optional, can use existing about.txt from file system)

## Format

Documents should be plain text files (`.txt`). If you have PDFs or other formats:

1. Convert to text first
2. Place in this directory
3. Update `scripts/generate_embeddings.py` or `scripts/generate-embeddings.js` to include the new file

## Example CV Format

```
Ryan Hill
Software Engineer & Quantum Computing Researcher

EXPERIENCE
----------
Software Engineer | Company Name | 2020 - Present
- Developed quantum algorithms for...
- Built software solutions using...

EDUCATION
---------
MEng in Engineering | University Name | 2015 - 2019

SKILLS
------
- Quantum Computing
- Python, JavaScript
- Machine Learning
```

