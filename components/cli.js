// CLI Terminal Component
const terminalBody = document.getElementById('terminalBody');
const terminalInput = document.getElementById('terminalInput');
let inputLine = document.getElementById('inputLine');
let inputContent = document.getElementById('inputContent');
let cursor = document.getElementById('cursor');
const closeButton = document.querySelector('.btn-close');

let commandHistory = [];
let historyIndex = -1;
let currentDirectory = '/home/ryan/portfolio';

// Mock file system structure with metadata
const fileSystem = {
  '/home/ryan/portfolio': {
    files: [
      {
        name: 'about.txt',
        size: 245,
        permissions: '-rw-r--r--',
        owner: 'ryan',
        date: 'Oct 15 10:30',
      },
      {
        name: 'contact.md',
        size: 189,
        permissions: '-rw-r--r--',
        owner: 'ryan',
        date: 'Oct 14 14:22',
      },
    ],
    directories: [
      {
        name: 'projects',
        permissions: 'drwxr-xr-x',
        owner: 'ryan',
        date: 'Oct 10 09:15',
      },
      {
        name: 'research',
        permissions: 'drwxr-xr-x',
        owner: 'ryan',
        date: 'Oct 12 16:45',
      },
    ],
  },
  '/home/ryan/portfolio/projects': {
    files: [
      {
        name: 'website.md',
        size: 512,
        permissions: '-rw-r--r--',
        owner: 'ryan',
        date: 'Oct 20 11:00',
      },
      {
        name: 'quantum-algorithms.md',
        size: 1024,
        permissions: '-rw-r--r--',
        owner: 'ryan',
        date: 'Oct 18 15:30',
      },
    ],
    directories: [],
  },
  '/home/ryan/portfolio/research': {
    files: [
      {
        name: 'papers.md',
        size: 2048,
        permissions: '-rw-r--r--',
        owner: 'ryan',
        date: 'Oct 22 09:00',
      },
      {
        name: 'notes.txt',
        size: 768,
        permissions: '-rw-r--r--',
        owner: 'ryan',
        date: 'Oct 21 13:20',
      },
    ],
    directories: [],
  },
};

// Helper functions for file system
function getFileNames(dir) {
  return dir.files.map((f) => (typeof f === 'string' ? f : f.name));
}

function getDirectoryNames(dir) {
  return dir.directories.map((d) => (typeof d === 'string' ? d : d.name));
}

function findFile(dir, filename) {
  return dir.files.find((f) =>
    typeof f === 'string' ? f === filename : f.name === filename,
  );
}

function findDirectory(dir, dirname) {
  return dir.directories.find((d) =>
    typeof d === 'string' ? d === dirname : d.name === dirname,
  );
}

function getFileContent(fileName) {
  const mockFiles = {
    'about.txt': `About Ryan Hill

Ryan is a software engineer and researcher passionate about quantum computing.
He holds an MEng in Engineering and works on quantum algorithms and software development.`,
    'contact.md': `Contact Information

Email: hello@ryanhill.tech
LinkedIn: ${knowledgeBase.links.linkedin}
GitHub: ${knowledgeBase.links.github}`,
    'website.md': `Website Project

This is Ryan's personal portfolio website featuring:
- Interactive wavefunction visualization
- CLI interface for learning about Ryan
- Modern, responsive design`,
    'quantum-algorithms.md': `Quantum Algorithms Research

Ryan's work on quantum algorithms includes:
- Variational Quantum Eigensolver (VQE)
- Quantum Approximate Optimization Algorithm (QAOA)
- Quantum machine learning applications`,
    'papers.md': `Research Papers

Publications and research contributions in quantum computing.`,
    'notes.txt': `Research Notes

Various notes and thoughts on quantum computing research.`,
  };
  return mockFiles[fileName] || '';
}

// Mock knowledge base about Ryan
const knowledgeBase = {
  name: 'Ryan Hill',
  location: 'Based in the UK',
  education: 'MEng in Engineering',
  skills: [
    'Quantum Computing',
    'Python',
    'JavaScript',
    'Software Engineering',
    'Machine Learning',
  ],
  interests: [
    'Quantum Computing',
    'Quantum Algorithms',
    'Software Development',
    'Research',
  ],
  links: {
    linkedin: 'https://www.linkedin.com/in/ryan-james-hill/',
    github: 'https://github.com/ryanhill1',
    stackexchange:
      'https://quantumcomputing.stackexchange.com/users/13991/ryanhill1',
  },
  projects: [
    'Personal website with interactive wavefunction visualization',
    'Quantum computing research and contributions',
  ],
  work: 'Software engineer and researcher with focus on quantum computing',
};

// Command handlers
const commands = {
  help: () => {
    return `Available commands:
  help              - Show this help message
  whoami            - Display current user
  skills            - List technical skills
  education         - Show educational background
  interests         - Display interests
  links             - Show social/professional links
  projects          - List projects
  clear             - Clear the terminal
  echo [text]       - Echo back the text
  date              - Show current date and time
  pwd               - Print working directory
  cd [dir]          - Change directory
  ls [-la]          - List directory contents
  cat [file]        - Display file contents
  grep [pattern]    - Search for pattern in input (use with |)
  cp [src] [dest]   - Copy file
  mv [src] [dest]   - Move/rename file
  mkdir [dir]       - Create directory
  rmdir [dir]       - Remove directory (permission denied)
  touch [file]      - Create or update file timestamp
  rm [file]         - Remove file (permission denied)
  less / more [file] - View file with pager
  head [-n] [file]  - Show first N lines
  tail [-n] [file]  - Show last N lines
  find [path] -name  - Search for files
  wc [-lwc] [file]  - Word/line/character count
  sort [-r] [file]  - Sort lines
  uniq [file]       - Remove duplicate lines
  history           - Show command history
  tree [-L n]       - Show directory tree
  top / htop        - Show system processes
  ps [aux]          - List processes
  df [-h]           - Show disk usage
  du [-h]           - Show directory sizes
  uname [-a]        - System information
  hostname          - Show hostname
  uptime            - Show system uptime
  curl [url]        - HTTP client (mock)
  ping [host]       - Network ping (mock)
  ssh [host]        - Remote login (disabled)
  scp [src] [dest]  - Secure copy (disabled)
  sudo [command]    - Run as superuser (disabled)
  chmod [mode] [file] - Change permissions (disabled)
  chown [owner] [file] - Change ownership (disabled)
  apt / yum / brew / pip - Package managers (disabled)
  git [command]     - Version control
  exit              - Return to home page`;
  },

  whoami: () => {
    return 'ryan';
  },

  skills: () => {
    return `Technical Skills:
${knowledgeBase.skills.map((skill) => `  • ${skill}`).join('\n')}`;
  },

  education: () => {
    return `Education:
  • ${knowledgeBase.education}`;
  },

  interests: () => {
    return `Interests:
${knowledgeBase.interests.map((interest) => `  • ${interest}`).join('\n')}`;
  },

  links: () => {
    return `Links:
  LinkedIn: ${knowledgeBase.links.linkedin}
  GitHub: ${knowledgeBase.links.github}
  Stack Exchange: ${knowledgeBase.links.stackexchange}`;
  },

  projects: () => {
    return `Projects:
${knowledgeBase.projects.map((project) => `  • ${project}`).join('\n')}`;
  },

  clear: () => {
    terminalBody.innerHTML = '';
    return null; // Don't add output line for clear
  },

  echo: (args) => {
    return args.join(' ') || '';
  },

  date: () => {
    return new Date().toString();
  },

  pwd: () => {
    return currentDirectory;
  },

  cd: (args) => {
    const target = args[0];
    if (!target) {
      // cd with no args goes to home
      currentDirectory = '/home/ryan/portfolio';
      return null;
    }

    if (target === '..') {
      // Go up one directory
      const parts = currentDirectory.split('/').filter((p) => p);
      if (parts.length > 2) {
        // Don't go above /home/ryan
        parts.pop();
        currentDirectory = '/' + parts.join('/');
      }
      return null;
    }

    if (target.startsWith('/')) {
      // Absolute path
      if (fileSystem[target]) {
        currentDirectory = target;
        return null;
      }
      return `cd: ${target}: No such file or directory`;
    }

    // Relative path
    const dir = fileSystem[currentDirectory];
    if (!dir) {
      return `cd: ${target}: No such file or directory`;
    }

    // Check if it's a directory in current location
    if (findDirectory(dir, target)) {
      const newPath =
        currentDirectory === '/'
          ? `/${target}`
          : `${currentDirectory}/${target}`;
      // Initialize if doesn't exist
      if (!fileSystem[newPath]) {
        fileSystem[newPath] = { files: [], directories: [] };
      }
      currentDirectory = newPath;
      return null;
    }

    return `cd: ${target}: No such file or directory`;
  },

  ls: (args) => {
    const dir = fileSystem[currentDirectory];
    if (!dir) {
      return `ls: cannot access '${currentDirectory}': No such file or directory`;
    }

    const showAll = args.includes('-a') || args.includes('--all');
    const longFormat =
      args.includes('-l') || args.includes('-la') || args.includes('-al');

    if (longFormat) {
      // ls -la format: permissions links owner group size date name
      const lines = ['total ' + (dir.files.length + dir.directories.length)];

      // Add directories
      dir.directories.forEach((d) => {
        const dirObj =
          typeof d === 'string'
            ? {
                name: d,
                permissions: 'drwxr-xr-x',
                owner: 'ryan',
                date: 'Oct 15 10:00',
                size: 4096,
              }
            : d;
        lines.push(
          `${dirObj.permissions}  2 ${dirObj.owner} ryan ${String(dirObj.size || 4096).padStart(5)} ${dirObj.date} ${dirObj.name}/`,
        );
      });

      // Add files
      dir.files.forEach((f) => {
        const fileObj =
          typeof f === 'string'
            ? {
                name: f,
                permissions: '-rw-r--r--',
                owner: 'ryan',
                date: 'Oct 15 10:00',
                size: 1024,
              }
            : f;
        lines.push(
          `${fileObj.permissions}  1 ${fileObj.owner} ryan ${String(fileObj.size).padStart(5)} ${fileObj.date} ${fileObj.name}`,
        );
      });

      return lines.join('\n');
    }

    // Regular ls
    const items = [
      ...getDirectoryNames(dir).map((d) => `${d}/`),
      ...getFileNames(dir),
    ];
    return items.join('\n') || '';
  },

  cat: (args) => {
    const file = args[0];
    if (!file) {
      return 'cat: missing file operand\nTry: cat [filename]';
    }

    // Check if file exists in current directory
    const dir = fileSystem[currentDirectory];
    if (!dir) {
      return `cat: ${file}: No such file or directory`;
    }

    // Check if it's a directory
    if (findDirectory(dir, file)) {
      return `cat: ${file}: Is a directory`;
    }

    // Check if file exists
    if (!findFile(dir, file)) {
      return `cat: ${file}: No such file or directory`;
    }

    const content = getFileContent(file);
    if (!content) {
      return `cat: ${file}: No such file or directory`;
    }
    return content;
  },

  grep: (args, stdin = '') => {
    const pattern = args[0];
    if (!pattern) {
      return 'grep: missing pattern\nUsage: grep [pattern]';
    }

    // Remove quotes if present
    const cleanPattern = pattern.replace(/^['"]|['"]$/g, '');

    // If stdin is provided (from pipe), search in it
    const textToSearch = stdin || '';

    if (!textToSearch) {
      return 'grep: no input provided\nUse with pipe: cat file.txt | grep pattern';
    }

    // Escape special regex characters in pattern for literal matching
    const escapedPattern = cleanPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedPattern})`, 'gi');

    // Split into lines and filter matching lines, highlighting matches
    const lines = textToSearch.split('\n');
    const matchingLines = lines
      .filter((line) => line.includes(cleanPattern))
      .map((line) => {
        // Replace all occurrences of the pattern with highlighted version
        return line.replace(regex, '<span class="grep-match">$1</span>');
      });

    return matchingLines.join('\n') || '';
  },

  rm: (args) => {
    if (args.length === 0) {
      return "rm: missing operand\nTry 'rm --help' for more information.";
    }

    // Check for -rf flag
    let targetIndex = 0;
    let isRecursive = false;

    if (args[0] === '-rf' || args[0] === '-r' || args[0] === '-f') {
      isRecursive = args[0].includes('r');
      targetIndex = 1;
    }

    if (targetIndex >= args.length) {
      return "rm: missing operand\nTry 'rm --help' for more information.";
    }

    const target = args[targetIndex];

    // Build the full path
    let fullPath;
    if (target.startsWith('/')) {
      // Absolute path
      fullPath = target;
    } else {
      // Relative path
      fullPath =
        currentDirectory === '/'
          ? `/${target}`
          : `${currentDirectory}/${target}`;
    }

    // Check if target exists in current directory
    const dir = fileSystem[currentDirectory];
    if (!dir) {
      return `rm: cannot remove '${fullPath}': No such file or directory`;
    }

    // Check if it's a file or directory
    const isFile = !!findFile(dir, target);
    const isDirectory = !!findDirectory(dir, target);

    if (!isFile && !isDirectory) {
      return `rm: cannot remove '${fullPath}': No such file or directory`;
    }

    // Always return permission denied
    if (isDirectory && !isRecursive) {
      return `rm: cannot remove '${fullPath}': Is a directory`;
    }

    return `rm: cannot remove '${fullPath}': Permission denied`;
  },

  cp: (args) => {
    if (args.length < 2) {
      return "cp: missing file operand\nTry 'cp --help' for more information.";
    }

    const source = args[args.length - 2];
    const dest = args[args.length - 1];

    const dir = fileSystem[currentDirectory];
    if (!dir) {
      return `cp: cannot stat '${source}': No such file or directory`;
    }

    const sourceFile = findFile(dir, source);
    if (!sourceFile) {
      return `cp: cannot stat '${source}': No such file or directory`;
    }

    // Create a copy in the same directory (simplified)
    const sourceName =
      typeof sourceFile === 'string' ? sourceFile : sourceFile.name;
    const destName = dest;

    // Check if destination already exists
    if (findFile(dir, destName) || findDirectory(dir, destName)) {
      return `cp: cannot create regular file '${destName}': File exists`;
    }

    // Add new file (simplified - just add to list)
    const newFile =
      typeof sourceFile === 'string'
        ? {
            name: destName,
            size: 1024,
            permissions: '-rw-r--r--',
            owner: 'ryan',
            date: new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            }),
          }
        : { ...sourceFile, name: destName };
    dir.files.push(newFile);

    return ''; // Success, no output
  },

  mv: (args) => {
    if (args.length < 2) {
      return "mv: missing file operand\nTry 'mv --help' for more information.";
    }

    const source = args[args.length - 2];
    const dest = args[args.length - 1];

    const dir = fileSystem[currentDirectory];
    if (!dir) {
      return `mv: cannot stat '${source}': No such file or directory`;
    }

    const sourceFile = findFile(dir, source);
    const sourceDir = findDirectory(dir, source);

    if (!sourceFile && !sourceDir) {
      return `mv: cannot stat '${source}': No such file or directory`;
    }

    // Check if destination exists
    if (findFile(dir, dest) || findDirectory(dir, dest)) {
      return `mv: cannot move '${source}' to '${dest}': File exists`;
    }

    // Rename the file or directory
    if (sourceFile) {
      const index = dir.files.indexOf(sourceFile);
      if (typeof sourceFile === 'string') {
        dir.files[index] = dest;
      } else {
        dir.files[index] = { ...sourceFile, name: dest };
      }
    } else if (sourceDir) {
      const index = dir.directories.indexOf(sourceDir);
      if (typeof sourceDir === 'string') {
        dir.directories[index] = dest;
      } else {
        dir.directories[index] = { ...sourceDir, name: dest };
      }
    }

    return ''; // Success
  },

  mkdir: (args) => {
    if (args.length === 0) {
      return "mkdir: missing operand\nTry 'mkdir --help' for more information.";
    }

    const dirName = args[0];
    const dir = fileSystem[currentDirectory];
    if (!dir) {
      return `mkdir: cannot create directory '${dirName}': No such file or directory`;
    }

    // Check if already exists
    if (findDirectory(dir, dirName) || findFile(dir, dirName)) {
      return `mkdir: cannot create directory '${dirName}': File exists`;
    }

    // Create new directory
    const newDir = {
      name: dirName,
      permissions: 'drwxr-xr-x',
      owner: 'ryan',
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    dir.directories.push(newDir);

    // Initialize the directory in fileSystem
    const newPath =
      currentDirectory === '/'
        ? `/${dirName}`
        : `${currentDirectory}/${dirName}`;
    fileSystem[newPath] = { files: [], directories: [] };

    return ''; // Success
  },

  rmdir: (args) => {
    if (args.length === 0) {
      return "rmdir: missing operand\nTry 'rmdir --help' for more information.";
    }

    const dirName = args[0];
    const fullPath =
      currentDirectory === '/'
        ? `/${dirName}`
        : `${currentDirectory}/${dirName}`;

    const dir = fileSystem[currentDirectory];
    if (!dir) {
      return `rmdir: cannot remove '${fullPath}': No such file or directory`;
    }

    const targetDir = findDirectory(dir, dirName);
    if (!targetDir) {
      return `rmdir: failed to remove '${dirName}': No such file or directory`;
    }

    // Check if directory is empty
    const targetPath =
      currentDirectory === '/'
        ? `/${dirName}`
        : `${currentDirectory}/${dirName}`;
    const targetDirContents = fileSystem[targetPath];
    if (
      targetDirContents &&
      (targetDirContents.files.length > 0 ||
        targetDirContents.directories.length > 0)
    ) {
      return `rmdir: failed to remove '${dirName}': Directory not empty`;
    }

    // Always return permission denied
    return `rmdir: cannot remove '${fullPath}': Permission denied`;
  },

  touch: (args) => {
    if (args.length === 0) {
      return "touch: missing file operand\nTry 'touch --help' for more information.";
    }

    const fileName = args[0];
    const dir = fileSystem[currentDirectory];
    if (!dir) {
      return `touch: cannot touch '${fileName}': No such file or directory`;
    }

    // Check if file already exists
    if (findFile(dir, fileName)) {
      // Update modification time (simulated)
      return ''; // Success, file exists
    }

    // Check if it's a directory
    if (findDirectory(dir, fileName)) {
      return `touch: cannot touch '${fileName}': Is a directory`;
    }

    // Create new file
    const newFile = {
      name: fileName,
      size: 0,
      permissions: '-rw-r--r--',
      owner: 'ryan',
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    dir.files.push(newFile);

    return ''; // Success
  },

  top: () => {
    return `top - 10:30:45 up 42 days,  3:15,  1 user,  load average: 0.15, 0.12, 0.10
Tasks: 127 total,   1 running, 126 sleeping,   0 stopped,   0 zombie
%Cpu(s):  2.3 us,  0.5 sy,  0.0 ni, 97.2 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :  16384.0 total,   2048.0 free,   4096.0 used,  10240.0 buff/cache
MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.  12288.0 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 1234 ryan      20   0   12345   1024    512 S   2.3   6.2   5:30.15 quantum-simulator
 1235 ryan      20   0    8192    512    256 S   1.5   3.1   3:15.42 website-dev
 1236 ryan      20   0    4096    256    128 S   0.8   1.5   1:20.10 research-notes
 1237 ryan      20   0    2048    128     64 S   0.3   0.8   0:45.33 cli-interface`;
  },

  htop: () => {
    return commands.top();
  },

  ps: (args) => {
    const aux = args.includes('aux') || args.includes('-aux');
    const ef = args.includes('-ef');

    if (aux || ef) {
      return `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
ryan      1234  2.3  6.2  12345  1024 ?        S    09:00   5:30 quantum-simulator
ryan      1235  1.5  3.1   8192   512 ?        S    08:30   3:15 website-dev
ryan      1236  0.8  1.5   4096   256 ?        S    10:00   1:20 research-notes
ryan      1237  0.3  0.8   2048   128 ?        S    10:15   0:45 cli-interface
ryan      1238  0.1  0.5   1024    64 ?        S    10:20   0:10 portfolio-site`;
    }

    return `  PID TTY          TIME CMD
 1234 ?        00:05:30 quantum-simulator
 1235 ?        00:03:15 website-dev
 1236 ?        00:01:20 research-notes
 1237 ?        00:00:45 cli-interface`;
  },

  df: (args) => {
    const h = args.includes('-h') || args.includes('--human-readable');
    const unit = h ? 'G' : '';
    const size = h ? '50' : '52428800';
    const used = h ? '12' : '12582912';
    const avail = h ? '35' : '36700160';
    const use = '25%';

    return `Filesystem      ${h ? 'Size' : '1K-blocks'}  Used Available Use% Mounted on
/dev/sda1        ${size.padStart(8)}${unit} ${used.padStart(8)}${unit} ${avail.padStart(8)}${unit}  ${use} /
tmpfs             2.0${unit}     0${unit.padEnd(1)}  2.0${unit.padEnd(1)}   0% /dev/shm
tmpfs             4.0${unit}     0${unit.padEnd(1)}  4.0${unit.padEnd(1)}   0% /tmp`;
  },

  du: (args) => {
    const h = args.includes('-h') || args.includes('--human-readable');
    const sh = args.includes('-sh');
    const target = args.find((arg) => !arg.startsWith('-')) || '.';

    if (sh && target === '.') {
      return h ? '2.5M\t.' : '2560\t.';
    }

    const dir = fileSystem[currentDirectory];
    if (!dir) {
      return `du: cannot access '${target}': No such file or directory`;
    }

    if (h) {
      return `512K\t./projects
1.2M\t./research
256K\t./about.txt
128K\t./contact.md
2.5M\t.`;
    }

    return `512\t./projects
1224\t./research
256\t./about.txt
128\t./contact.md
2560\t.`;
  },

  curl: (args) => {
    if (args.length === 0) {
      return "curl: try 'curl --help' or 'curl --manual' for more information";
    }

    const url = args[args.length - 1];

    // Check for common flags
    if (args.includes('--help') || args.includes('-h')) {
      return `curl: try 'curl --help' or 'curl --manual' for more information
Usage: curl [options...] <url>
     -d, --data <data>     HTTP POST data
     -f, --fail            Fail silently on HTTP errors
     -h, --help            This help text
     -i, --include         Include protocol response headers
     -o, --output <file>   Write to file instead of stdout
     -s, --silent          Silent mode
     -v, --verbose         Verbose mode`;
    }

    // Mock response for any URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return `  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   256  100   256    0     0   1024      0  0:00:00  0:00:00 --:--:--  1024

<!DOCTYPE html>
<html>
<head><title>Ryan's Portfolio</title></head>
<body>
<h1>Hello from the web!</h1>
<p>This is a mock curl response. In a real terminal, this would fetch the actual content.</p>
</body>
</html>`;
    }

    return `curl: (6) Could not resolve host: ${url}`;
  },

  ping: (args) => {
    if (args.length === 0) {
      return 'ping: usage error: Destination address required';
    }

    const host = args[0];
    const count = args.includes('-c')
      ? parseInt(args[args.indexOf('-c') + 1]) || 4
      : 4;

    if (host === 'localhost' || host === '127.0.0.1') {
      let output = `PING ${host} (127.0.0.1) 56(84) bytes of data.\n`;
      for (let i = 0; i < count; i++) {
        const time = (Math.random() * 2 + 0.1).toFixed(3);
        output += `64 bytes from ${host} (127.0.0.1): icmp_seq=${i + 1} ttl=64 time=${time} ms\n`;
      }
      output += `\n--- ${host} ping statistics ---\n`;
      output += `${count} packets transmitted, ${count} received, 0% packet loss, time ${count * 1000}ms\n`;
      output += `rtt min/avg/max/mdev = 0.100/${(0.5 + Math.random() * 1.5).toFixed(3)}/2.500/0.500 ms`;
      return output;
    }

    return `ping: ${host}: Name or service not known`;
  },

  ssh: (args) => {
    if (args.length === 0) {
      return 'usage: ssh [-46AaCfGgKkMNnqsTtVvXxYy] [-b bind_address] [-c cipher_spec]\n           [-D [bind_address:]port] [-E log_file] [-e escape_char]\n           [-F configfile] [-I pkcs11] [-i identity_file]\n           [-J destination] [-L address] [-l login_name] [-m mac_spec]\n           [-O ctl_cmd] [-o option] [-p port] [-Q query_option] [-R address]\n           [-S ctl_path] [-W host:port] [-w local_tun[:remote_tun]]\n           destination [command]';
    }

    const host = args[args.length - 1];
    return `ssh: connect to host ${host} port 22: Connection refused\n(Don't worry, this is just a portfolio site - no actual SSH access!)`;
  },

  scp: (args) => {
    if (args.length < 2) {
      return 'usage: scp [-346BCpqrTv] [-c cipher] [-F ssh_config] [-i identity_file]\n           [-l limit] [-o ssh_option] [-P port] [-S program]\n           source ... target';
    }

    const source = args[args.length - 2];
    const dest = args[args.length - 1];
    return `scp: ${source}: No such file or directory\n(File transfer disabled - this is a portfolio CLI, not a real server!)`;
  },

  apt: (args) => {
    if (args.length === 0 || args[0] === '--help') {
      return `apt 2.4.5 (amd64)
Usage: apt [options] command

Basic commands:
  list - list packages
  search - search for packages
  show - show package details
  install - install packages
  remove - remove packages
  update - update package list
  upgrade - upgrade packages

This is a portfolio site - package management is disabled for security reasons!`;
    }

    const command = args[0];
    if (
      command === 'install' ||
      command === 'remove' ||
      command === 'upgrade'
    ) {
      return `Reading package lists... Done
Building dependency tree... Done
E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)
E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?

(This is a portfolio site - no actual package management!)`;
    }

    return `This is a portfolio site - package management is disabled!`;
  },

  yum: (args) => {
    if (args.length === 0 || args[0] === '--help') {
      return `Usage: yum [options] COMMAND

List of Commands:

install         Install a package or packages on your system
update          Update a package or packages on your system
remove          Remove a package or packages from your system

This is a portfolio site - package management is disabled!`;
    }

    return `Loaded plugins: fastestmirror
Error: This is a portfolio site - no actual package management!
       (But nice try! 😊)`;
  },

  brew: (args) => {
    if (args.length === 0 || args[0] === '--help') {
      return `Example usage:
  brew search [TEXT|/REGEX/]
  brew info [FORMULA...]
  brew install FORMULA...
  brew update
  brew upgrade [FORMULA...]
  brew uninstall FORMULA...

This is a portfolio site - Homebrew is disabled!`;
    }

    const command = args[0];
    if (command === 'install' || command === 'uninstall') {
      return `Error: This is a portfolio site - Homebrew is not available!
(But you have good taste in package managers! 🍺)`;
    }

    return `This is a portfolio site - Homebrew is disabled!`;
  },

  pip: (args) => {
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
      return `Usage:
  pip <command> [options]

Commands:
  install                     Install packages.
  download                    Download packages.
  uninstall                   Uninstall packages.
  freeze                      Output installed packages in requirements format.
  list                        List installed packages.
  show                        Show information about installed packages.
  search                      Search PyPI for packages.
  check                       Verify installed packages have compatible dependencies.

This is a portfolio site - pip is not available!
(But nice try! 🐍)`;
    }

    const command = args[0];

    if (command === 'install') {
      const packageName = args[1] || 'package';
      return `Collecting ${packageName}
  Downloading ${packageName}-1.0.0-py3-none-any.whl
Installing collected packages: ${packageName}
Successfully installed ${packageName}-1.0.0

(Just kidding! This is a portfolio site - pip install is disabled for security reasons.)`;
    }

    if (command === 'uninstall') {
      const packageName = args[1] || 'package';
      return `Found existing installation: ${packageName} 1.0.0
Uninstalling ${packageName}-1.0.0:
  Successfully uninstalled ${packageName}-1.0.0

(Just kidding! This is a portfolio site - pip uninstall is disabled.)`;
    }

    if (command === 'list') {
      return `Package    Version
---------- -------
pip        23.0.1
setuptools 65.5.0
wheel      0.38.4

(This is a mock list - pip is not actually available on this portfolio site!)`;
    }

    if (command === 'freeze') {
      return `pip==23.0.1
setuptools==65.5.0
wheel==0.38.4

(This is a mock output - pip is not actually available on this portfolio site!)`;
    }

    if (command === 'show') {
      const packageName = args[1] || 'pip';
      return `Name: ${packageName}
Version: 1.0.0
Summary: A mock package (this is a portfolio site)
Location: /usr/local/lib/python3.11/site-packages
Requires:

(This is a mock output - pip is not actually available on this portfolio site!)`;
    }

    if (command === 'search') {
      const query = args[1] || 'package';
      return `Searching for "${query}" on PyPI...
No packages found matching "${query}".

(This is a portfolio site - pip search is disabled!)`;
    }

    if (command === 'check') {
      return `No broken requirements found.

(This is a portfolio site - pip check is disabled!)`;
    }

    if (command === '--version' || command === '-V') {
      return `pip 23.0.1 from /usr/local/lib/python3.11/site-packages/pip (python 3.11)

(This is a mock version - pip is not actually available on this portfolio site!)`;
    }

    return `pip: unknown command "${command}"
Type 'pip --help' for usage.

This is a portfolio site - pip is not available!`;
  },

  git: (args) => {
    if (args.length === 0) {
      return 'usage: git [--version] [--help] [-C <path>] [-c name=value]\n           [--exec-path[=<path>] [--html-path] [--man-path] [--info-path]\n           [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--bare]\n           [--git-dir=<path>] [--work-tree=<path>] <command> [<args>]';
    }

    const command = args[0];

    if (command === 'status') {
      return `On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean`;
    }

    if (command === 'log' || command === '--oneline') {
      return `a1b2c3d (HEAD -> main, origin/main) Add CLI interface
d4e5f6g Update wavefunction visualization
g7h8i9j Initial commit`;
    }

    if (command === 'branch') {
      return '* main';
    }

    if (command === 'remote') {
      if (args[1] === '-v') {
        return `origin  https://github.com/ryanhill1/ryanhill1.github.io.git (fetch)
origin  https://github.com/ryanhill1/ryanhill1.github.io.git (push)`;
      }
      return 'origin';
    }

    if (command === 'clone' || command === 'push' || command === 'pull') {
      return `This is a portfolio site - git operations are read-only!
(You can view the source at: https://github.com/ryanhill1/ryanhill1.github.io)`;
    }

    return `git: '${command}' is not a git command. See 'git --help'.`;
  },

  less: (args, stdin = '') => {
    const file = args[0];
    let content = stdin;

    if (!content && file) {
      const dir = fileSystem[currentDirectory];
      if (!dir) {
        return `less: ${file}: No such file or directory`;
      }

      const fileObj = findFile(dir, file);
      if (!fileObj) {
        return `less: ${file}: No such file or directory`;
      }

      const fileName = typeof fileObj === 'string' ? fileObj : fileObj.name;
      content = getFileContent(fileName);
    }

    if (!content) {
      return `less: no input provided`;
    }

    // Simulate less - just show the content (in real less, you'd have scrolling)
    return content;
  },

  more: (args, stdin = '') => {
    // Similar to less but simpler
    return commands.less(args, stdin);
  },

  head: (args, stdin = '') => {
    const n = args.includes('-n')
      ? parseInt(args[args.indexOf('-n') + 1]) || 10
      : 10;
    const file = args.find((arg) => !arg.startsWith('-') && arg !== '');
    let content = stdin;

    if (!content && file) {
      const dir = fileSystem[currentDirectory];
      if (!dir) {
        return `head: cannot open '${file}' for reading: No such file or directory`;
      }

      const fileObj = findFile(dir, file);
      if (!fileObj) {
        return `head: cannot open '${file}' for reading: No such file or directory`;
      }

      const fileName = typeof fileObj === 'string' ? fileObj : fileObj.name;
      content = getFileContent(fileName);
    }

    if (!content && !file) {
      return 'head: missing file operand';
    }

    const lines = content.split('\n');
    return lines.slice(0, n).join('\n');
  },

  tail: (args, stdin = '') => {
    const n = args.includes('-n')
      ? parseInt(args[args.indexOf('-n') + 1]) || 10
      : 10;
    const file = args.find((arg) => !arg.startsWith('-') && arg !== '');
    let content = stdin;

    if (!content && file) {
      const dir = fileSystem[currentDirectory];
      if (!dir) {
        return `tail: cannot open '${file}' for reading: No such file or directory`;
      }

      const fileObj = findFile(dir, file);
      if (!fileObj) {
        return `tail: cannot open '${file}' for reading: No such file or directory`;
      }

      const fileName = typeof fileObj === 'string' ? fileObj : fileObj.name;
      content = getFileContent(fileName);
    }

    if (!content && !file) {
      return 'tail: missing file operand';
    }

    const lines = content.split('\n');
    return lines.slice(-n).join('\n');
  },

  find: (args) => {
    const path = args.find((arg) => !arg.startsWith('-')) || '.';
    const name = args.includes('-name')
      ? args[args.indexOf('-name') + 1]
      : null;

    if (!name) {
      return "find: missing argument to `-name'";
    }

    // Remove quotes if present
    const pattern = name.replace(/^['"]|['"]$/g, '').replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`, 'i');

    const results = [];

    function searchDir(dirPath) {
      const dir = fileSystem[dirPath];
      if (!dir) return;

      // Search files
      getFileNames(dir).forEach((file) => {
        if (regex.test(file)) {
          const fullPath = dirPath === '/' ? `/${file}` : `${dirPath}/${file}`;
          results.push(fullPath);
        }
      });

      // Search directories
      getDirectoryNames(dir).forEach((dirName) => {
        if (regex.test(dirName)) {
          const fullPath =
            dirPath === '/' ? `/${dirName}` : `${dirPath}/${dirName}`;
          results.push(fullPath);
        }
        // Recursively search subdirectories
        const subPath =
          dirPath === '/' ? `/${dirName}` : `${dirPath}/${dirName}`;
        if (fileSystem[subPath]) {
          searchDir(subPath);
        }
      });
    }

    const searchPath =
      path === '.'
        ? currentDirectory
        : path.startsWith('/')
          ? path
          : `${currentDirectory}/${path}`;
    searchDir(searchPath);

    return results.length > 0 ? results.join('\n') : '';
  },

  wc: (args, stdin = '') => {
    const l = args.includes('-l');
    const w = args.includes('-w');
    const c = args.includes('-c');
    const file = args.find((arg) => !arg.startsWith('-'));
    let content = stdin;

    if (!content && file) {
      const dir = fileSystem[currentDirectory];
      if (!dir) {
        return `wc: ${file}: No such file or directory`;
      }

      const fileObj = findFile(dir, file);
      if (!fileObj) {
        return `wc: ${file}: No such file or directory`;
      }

      const fileName = typeof fileObj === 'string' ? fileObj : fileObj.name;
      content = getFileContent(fileName);
    }

    if (!content && !file) {
      return 'wc: missing file operand';
    }

    const lines = content.split('\n');
    const words = content.split(/\s+/).filter((w) => w.length > 0);
    const chars = content.length;

    if (l && w && c) {
      return `${lines.length} ${words.length} ${chars} ${file || ''}`;
    } else if (l) {
      return `${lines.length} ${file || ''}`;
    } else if (w) {
      return `${words.length} ${file || ''}`;
    } else if (c) {
      return `${chars} ${file || ''}`;
    }

    return `${lines.length} ${words.length} ${chars} ${file || ''}`;
  },

  sort: (args, stdin = '') => {
    const r = args.includes('-r');
    const file = args.find((arg) => !arg.startsWith('-'));
    let content = stdin;

    if (!content && file) {
      const dir = fileSystem[currentDirectory];
      if (!dir) {
        return `sort: ${file}: No such file or directory`;
      }

      const fileObj = findFile(dir, file);
      if (!fileObj) {
        return `sort: ${file}: No such file or directory`;
      }

      const fileName = typeof fileObj === 'string' ? fileObj : fileObj.name;
      content = getFileContent(fileName);
    }

    if (!content && !file) {
      return 'sort: missing file operand';
    }

    const lines = content.split('\n');
    const sorted = r ? lines.sort().reverse() : lines.sort();
    return sorted.join('\n');
  },

  uniq: (args, stdin = '') => {
    const file = args.find((arg) => !arg.startsWith('-'));
    let content = stdin;

    if (!content && file) {
      const dir = fileSystem[currentDirectory];
      if (!dir) {
        return `uniq: ${file}: No such file or directory`;
      }

      const fileObj = findFile(dir, file);
      if (!fileObj) {
        return `uniq: ${file}: No such file or directory`;
      }

      const fileName = typeof fileObj === 'string' ? fileObj : fileObj.name;
      content = getFileContent(fileName);
    }

    if (!content && !file) {
      return 'uniq: missing file operand';
    }

    const lines = content.split('\n');
    const unique = [];
    let lastLine = null;
    for (const line of lines) {
      if (line !== lastLine) {
        unique.push(line);
        lastLine = line;
      }
    }
    return unique.join('\n');
  },

  history: () => {
    if (commandHistory.length === 0) {
      return '';
    }
    return commandHistory
      .map((cmd, index) => `${index + 1}  ${cmd}`)
      .join('\n');
  },

  tree: (args) => {
    const path = args.find((arg) => !arg.startsWith('-')) || '.';
    const depth = args.includes('-L')
      ? parseInt(args[args.indexOf('-L') + 1])
      : Infinity;

    const searchPath =
      path === '.'
        ? currentDirectory
        : path.startsWith('/')
          ? path
          : `${currentDirectory}/${path}`;
    const dir = fileSystem[searchPath];

    if (!dir) {
      return `tree: ${path}: No such file or directory`;
    }

    function buildTree(dirPath, prefix = '', currentDepth = 0) {
      if (currentDepth >= depth) return '';

      const dir = fileSystem[dirPath];
      if (!dir) return '';

      let output = '';
      const allItems = [
        ...getDirectoryNames(dir).map((d) => ({ name: d, type: 'dir' })),
        ...getFileNames(dir).map((f) => ({ name: f, type: 'file' })),
      ];

      allItems.forEach((item, index) => {
        const isLast = index === allItems.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        output +=
          prefix +
          connector +
          item.name +
          (item.type === 'dir' ? '/' : '') +
          '\n';

        if (item.type === 'dir') {
          const subPath =
            dirPath === '/' ? `/${item.name}` : `${dirPath}/${item.name}`;
          if (fileSystem[subPath]) {
            const nextPrefix = prefix + (isLast ? '    ' : '│   ');
            output += buildTree(subPath, nextPrefix, currentDepth + 1);
          }
        }
      });

      return output;
    }

    const baseName =
      searchPath === '/home/ryan/portfolio' ? '.' : searchPath.split('/').pop();
    return baseName + '\n' + buildTree(searchPath, '', 0);
  },

  sudo: (args) => {
    if (args.length === 0) {
      return 'sudo: usage: sudo [-h] [-V] [-S] [-v] [-k] [-K] [-s] [-u username|#uid] command';
    }

    const command = args[0];
    return `sudo: ${command}: command not found\n(Or maybe you just need to ask nicely? This is a portfolio site, not a real server! 😊)`;
  },

  chmod: (args) => {
    if (args.length < 2) {
      return "chmod: missing operand\nTry 'chmod --help' for more information.";
    }

    const mode = args[0];
    const target = args[1];
    const fullPath =
      currentDirectory === '/' ? `/${target}` : `${currentDirectory}/${target}`;

    return `chmod: changing permissions of '${fullPath}': Operation not permitted\n(This is a portfolio site - file permissions are read-only!)`;
  },

  chown: (args) => {
    if (args.length < 2) {
      return "chown: missing operand\nTry 'chown --help' for more information.";
    }

    const owner = args[0];
    const target = args[1];
    const fullPath =
      currentDirectory === '/' ? `/${target}` : `${currentDirectory}/${target}`;

    return `chown: changing ownership of '${fullPath}': Operation not permitted\n(This is a portfolio site - file ownership is read-only!)`;
  },

  uname: (args) => {
    const a = args.includes('-a') || args.includes('--all');
    const r = args.includes('-r');
    const m = args.includes('-m');
    const s = args.includes('-s');

    if (a) {
      return 'Linux portfolio 6.1.0-ryan-generic #1 SMP PREEMPT_DYNAMIC Mon Oct 15 10:00:00 UTC 2024 x86_64 GNU/Linux';
    }
    if (r) {
      return '6.1.0-ryan-generic';
    }
    if (m) {
      return 'x86_64';
    }
    if (s) {
      return 'Linux';
    }

    return 'Linux';
  },

  hostname: () => {
    return 'portfolio';
  },

  uptime: () => {
    const days = 42;
    const hours = 3;
    const minutes = 15;
    const load1 = '0.15';
    const load5 = '0.12';
    const load15 = '0.10';

    return ` 10:30:45 up ${days} days, ${hours}:${minutes},  1 user,  load average: ${load1}, ${load5}, ${load15}`;
  },

  exit: () => {
    window.location.href = '/';
    return null;
  },
};

// Vector DB-based response generator
async function handleQuestion(input) {
  // Show thinking indicator
  const thinkingLine = addLine(
    '<span class="output info">Searching knowledge base...</span>',
  );

  try {
    // Check if vector DB is available
    if (typeof window.vectorDB === 'undefined') {
      // Fallback to mock response if vector DB not loaded
      thinkingLine.remove();
      const response = generateMockResponse(input);
      addLine(`<span class="output info">${response}</span>`);
      return;
    }

    // Search vector database
    const results = await window.vectorDB.search(input, {
      threshold: 0.5, // Higher threshold for better precision
      maxResults: 2, // Limit to top 2 most relevant chunks
    });

    thinkingLine.remove();

    if (results.length === 0) {
      // No relevant results found
      const response = generateMockResponse(input);
      addLine(`<span class="output info">${response}</span>`);
      return;
    }

    // Build response from retrieved context
    const context = results.map((r, i) => `${i + 1}. ${r.text}`).join('\n\n');

    // Generate response (for now, just show the context)
    // In production, you'd send this to an LLM API for better responses
    const response = formatVectorResponse(input, results);
    addLine(`<span class="output info">${response}</span>`);
  } catch (error) {
    console.error('Vector search error:', error);
    thinkingLine.remove();
    const response = generateMockResponse(input);
    addLine(`<span class="output info">${response}</span>`);
  }
}

// Format response from vector search results
function formatVectorResponse(query, results) {
  if (results.length === 0) {
    return generateMockResponse(query);
  }

  // Use only the top result for focused answers
  const topResult = results[0];

  // If similarity is very high, use that chunk directly
  // Otherwise, try to extract a more focused answer
  let response = '';

  if (topResult.similarity > 0.65) {
    // High confidence - use the most relevant chunk
    response = topResult.text;

    // If the chunk is very long, try to extract the most relevant sentence
    if (response.length > 500) {
      const sentences = response
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 0);
      const queryWords = query.toLowerCase().split(/\s+/);

      // Find sentence with most query word matches
      let bestSentence = sentences[0];
      let maxMatches = 0;

      for (const sentence of sentences) {
        const sentenceLower = sentence.toLowerCase();
        const matches = queryWords.filter((word) =>
          sentenceLower.includes(word),
        ).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          bestSentence = sentence.trim();
        }
      }

      // Use best sentence plus some context
      if (bestSentence.length > 50) {
        response = bestSentence + '.';
        // Add next sentence if it's short
        const bestIndex = sentences.findIndex((s) => s.trim() === bestSentence);
        if (bestIndex >= 0 && bestIndex < sentences.length - 1) {
          const nextSentence = sentences[bestIndex + 1].trim();
          if (nextSentence.length < 200) {
            response += ' ' + nextSentence + '.';
          }
        }
      }
    }
  } else if (topResult.similarity > 0.5) {
    // Medium confidence - use top result but truncate if too long
    response = topResult.text;
    if (response.length > 400) {
      // Take first 400 chars and find a good stopping point
      const truncated = response.substring(0, 400);
      const lastPeriod = truncated.lastIndexOf('.');
      const lastNewline = truncated.lastIndexOf('\n');
      const stopPoint = Math.max(lastPeriod, lastNewline);
      if (stopPoint > 200) {
        response = truncated.substring(0, stopPoint + 1);
      } else {
        response = truncated + '...';
      }
    }
  } else {
    // Low confidence - provide a brief summary
    const words = topResult.text.split(/\s+/);
    response = words.slice(0, 50).join(' ') + (words.length > 50 ? '...' : '');
  }

  // Clean up the response (remove excessive whitespace, fix formatting)
  response = response.replace(/\s+/g, ' ').trim();

  return response;
}

// Fallback mock response generator (for when vector DB is unavailable)
function generateMockResponse(input) {
  const lowerInput = input.toLowerCase();

  // Simple keyword matching for mock responses
  if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
    return "Hello! I'm Ryan's CLI assistant. How can I help you learn about Ryan?";
  }

  if (lowerInput.includes('what') && lowerInput.includes('do')) {
    return `Ryan works as a software engineer and researcher, focusing on quantum computing.
He develops quantum algorithms and builds software solutions.`;
  }

  if (lowerInput.includes('where')) {
    return `Ryan is based in the UK.`;
  }

  if (lowerInput.includes('quantum')) {
    return `Ryan is passionate about quantum computing. He works on quantum algorithms,
contributes to quantum computing communities, and researches quantum computing applications.`;
  }

  if (lowerInput.includes('experience') || lowerInput.includes('background')) {
    return `Ryan has a background in engineering with an MEng degree. He specializes in
quantum computing, software development, and research.`;
  }

  if (lowerInput.includes('contact') || lowerInput.includes('email')) {
    return `You can reach Ryan at hello@ryanhill.tech
Or connect via LinkedIn: ${knowledgeBase.links.linkedin}`;
  }

  // Default response
  return `I understand you're asking about "${input}". 
Ryan is a software engineer and quantum computing researcher. 
Try asking more specific questions, or type 'help' to see available commands.`;
}

function addLine(text, className = '') {
  const line = document.createElement('div');
  line.className = `terminal-line ${className}`;
  line.innerHTML = text;
  terminalBody.appendChild(line);
  terminalBody.scrollTop = terminalBody.scrollHeight;
  return line;
}

function updateInputDisplay() {
  if (inputContent) {
    // Use textContent to preserve all characters including spaces
    // The CSS white-space: pre will preserve spacing
    inputContent.textContent = terminalInput.value;
    // Scroll to bottom
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }
}

function getPrompt() {
  const dir =
    currentDirectory === '/home/ryan/portfolio'
      ? '~'
      : currentDirectory.replace('/home/ryan/portfolio', '~');
  return `ryan@portfolio:${dir}$`;
}

function createNewInputLine() {
  const newInputLine = document.createElement('div');
  newInputLine.className = 'terminal-input-line';
  newInputLine.innerHTML = `
    <span class="prompt">${getPrompt()}</span>
    <span class="input-content"></span>
    <span class="cursor">█</span>
  `;
  return newInputLine;
}

function getAutocompleteSuggestions(input) {
  const trimmed = input.trim();
  const parts = trimmed.split(/\s+/);
  const command = parts[0] || '';
  const arg = parts[1] || '';

  // If no command yet, suggest commands
  if (parts.length === 1 && arg === '') {
    const allCommands = Object.keys(commands);
    return allCommands.filter((cmd) => cmd.startsWith(command.toLowerCase()));
  }

  // If command is cat, cd, cp, mv, rm, mkdir, rmdir, touch, less, more, head, tail, find, suggest files/directories
  const fileCommands = [
    'cat',
    'cp',
    'mv',
    'rm',
    'touch',
    'less',
    'more',
    'head',
    'tail',
    'wc',
    'sort',
    'uniq',
  ];
  const dirCommands = ['cd', 'mkdir', 'rmdir'];
  const bothCommands = [...fileCommands, ...dirCommands];

  if (bothCommands.includes(command.toLowerCase())) {
    const dir = fileSystem[currentDirectory];
    if (!dir) return [];

    // Handle flags for rm, cp, mv commands
    let actualArg = arg;
    if (
      command.toLowerCase() === 'rm' &&
      (arg === '-rf' || arg === '-r' || arg === '-f')
    ) {
      const parts = input.trim().split(/\s+/);
      actualArg = parts[2] || '';
    }

    // For cd, mkdir, rmdir: suggest directories only
    // For others: suggest both files and directories
    let items;
    if (dirCommands.includes(command.toLowerCase())) {
      items = getDirectoryNames(dir);
    } else {
      items = [...getFileNames(dir), ...getDirectoryNames(dir)];
    }

    // Case-insensitive matching
    const lowerArg = actualArg.toLowerCase();
    return items.filter((item) => item.toLowerCase().startsWith(lowerArg));
  }

  // If command is grep and we're in a pipe, don't suggest files
  // (grep pattern comes after the pipe)
  if (command.toLowerCase() === 'grep') {
    // Could suggest common patterns, but for now return empty
    return [];
  }

  return [];
}

function handleAutocomplete() {
  const input = terminalInput.value;
  const suggestions = getAutocompleteSuggestions(input);

  if (suggestions.length === 0) {
    // No suggestions, beep or do nothing
    return;
  }

  if (suggestions.length === 1) {
    // Single match - complete it
    const parts = input.trim().split(/\s+/);
    const command = parts[0];
    const completion = suggestions[0];

    if (parts.length === 1) {
      // Completing command
      terminalInput.value = completion + ' ';
    } else {
      // Completing argument - preserve the original case of the input
      // Handle rm with flags
      let prefix = '';
      if (
        command.toLowerCase() === 'rm' &&
        (parts[1] === '-rf' || parts[1] === '-r' || parts[1] === '-f')
      ) {
        prefix = parts[1] + ' ';
      }

      // Find the matching item with correct case
      const dir = fileSystem[currentDirectory];
      let matchedItem = completion;
      if (dir) {
        const allItems =
          command.toLowerCase() === 'cd'
            ? dir.directories
            : [...dir.files, ...dir.directories];
        const found = allItems.find((item) => {
          const itemName = typeof item === 'string' ? item : item.name;
          return itemName.toLowerCase() === completion.toLowerCase();
        });
        if (found) {
          matchedItem = typeof found === 'string' ? found : found.name;
        }
      }
      terminalInput.value = command + ' ' + prefix + matchedItem + ' ';
    }
    updateInputDisplay();
  } else {
    // Multiple matches - find common prefix
    const parts = input.trim().split(/\s+/);
    const command = parts[0];
    let arg = parts[1] || '';

    // Handle rm with flags
    let flagPrefix = '';
    if (
      command.toLowerCase() === 'rm' &&
      (arg === '-rf' || arg === '-r' || arg === '-f')
    ) {
      flagPrefix = arg + ' ';
      arg = parts[2] || '';
    }

    // Find longest common prefix (case-insensitive)
    let commonPrefix = suggestions[0].toLowerCase();
    for (let i = 1; i < suggestions.length; i++) {
      const suggestion = suggestions[i].toLowerCase();
      let j = 0;
      while (
        j < commonPrefix.length &&
        j < suggestion.length &&
        commonPrefix[j] === suggestion[j]
      ) {
        j++;
      }
      commonPrefix = commonPrefix.substring(0, j);
      if (commonPrefix === arg.toLowerCase()) break;
    }

    if (commonPrefix.length > arg.length) {
      // Complete up to common prefix - use original case from first suggestion
      const prefixMatch = suggestions[0].substring(0, commonPrefix.length);
      terminalInput.value = command + ' ' + flagPrefix + prefixMatch;
      updateInputDisplay();
    } else {
      // Show all options
      addLine(`<span class="output info">${suggestions.join('  ')}</span>`);
    }
  }
}

function processCommand(input) {
  const trimmed = input.trim();

  // Store reference to current input line before modifying
  const currentInputLine = inputLine;

  // Get the text that was typed
  const inputText = input;

  // Remove cursor element
  const cursorElement = currentInputLine.querySelector('.cursor');
  if (cursorElement) {
    cursorElement.remove();
  }

  // Get the prompt that was used (before directory might change)
  const promptElement = currentInputLine.querySelector('.prompt');
  const promptText = promptElement ? promptElement.textContent : getPrompt();

  // Convert input-content to regular text (remove the span wrapper)
  const inputContentElement = currentInputLine.querySelector('.input-content');
  if (inputContentElement) {
    // Replace the span with a text node to preserve exact positioning
    const textNode = document.createTextNode(inputText);
    inputContentElement.parentNode.replaceChild(textNode, inputContentElement);
  }

  // Update prompt in case directory changed (for cd command)
  if (promptElement) {
    promptElement.textContent = getPrompt();
  }

  // Change class to terminal-line (this should maintain the same layout)
  currentInputLine.className = 'terminal-line';

  // Only process command if there's actual input
  if (trimmed) {
    // Add command to history
    commandHistory.push(trimmed);
    historyIndex = commandHistory.length;

    // Check for pipes
    if (trimmed.includes('|')) {
      // Handle piped commands
      const pipeCommands = trimmed.split('|').map((cmd) => cmd.trim());
      let stdin = '';

      for (let i = 0; i < pipeCommands.length; i++) {
        const cmdStr = pipeCommands[i];
        const parts = cmdStr.split(/\s+/);
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (commands[command]) {
          // Commands that accept stdin
          const stdinCommands = [
            'grep',
            'less',
            'more',
            'head',
            'tail',
            'wc',
            'sort',
            'uniq',
          ];

          if (stdinCommands.includes(command)) {
            const output = commands[command](args, stdin);
            if (output !== null) {
              stdin = output;
            } else {
              stdin = '';
            }
          } else {
            // For other commands, execute normally and use output as stdin for next
            const output = commands[command](args);
            if (output !== null) {
              stdin = output;
            } else {
              stdin = '';
            }
          }
        } else {
          // Unknown command in pipe
          addLine(
            `<span class="output error">${command}: command not found</span>`,
          );
          stdin = '';
          break;
        }
      }

      // Display final output (may contain HTML from grep highlighting)
      if (stdin !== '') {
        // Check if output contains HTML (from grep highlighting)
        if (stdin.includes('<span class="grep-match">')) {
          addLine(`<span class="output">${stdin}</span>`, 'grep-output');
        } else {
          addLine(`<span class="output">${stdin}</span>`);
        }
      }
    } else {
      // No pipes, execute normally
      const parts = trimmed.split(/\s+/);
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      // Check if it's a known command
      if (commands[command]) {
        const output = commands[command](args);
        if (output !== null) {
          addLine(`<span class="output">${output}</span>`);
        }
      } else {
        // Treat as a question - use vector DB for intelligent responses
        handleQuestion(trimmed);
      }
    }
  }

  // Always add new input line at the end
  const nextInputLine = createNewInputLine();
  terminalBody.appendChild(nextInputLine);
  inputLine = nextInputLine;
  inputContent = nextInputLine.querySelector('.input-content');
  cursor = nextInputLine.querySelector('.cursor');

  // Clear input and focus
  terminalInput.value = '';
  updateInputDisplay();
  terminalInput.focus();
}

// Handle input
terminalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const input = terminalInput.value;
    processCommand(input);
  } else if (e.key === 'Tab') {
    e.preventDefault();
    handleAutocomplete();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (historyIndex > 0) {
      historyIndex--;
      terminalInput.value = commandHistory[historyIndex];
      updateInputDisplay();
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      terminalInput.value = commandHistory[historyIndex];
      updateInputDisplay();
    } else {
      historyIndex = commandHistory.length;
      terminalInput.value = '';
      updateInputDisplay();
    }
  }
  // For spacebar and other keys, let them through to input event
  // but ensure display updates
});

// Update display as user types (this should catch spacebar)
terminalInput.addEventListener('input', () => {
  updateInputDisplay();
});

// Also handle keyup for spacebar to ensure it's captured
terminalInput.addEventListener('keyup', (e) => {
  if (e.key === ' ') {
    updateInputDisplay();
  }
});

// Close button functionality
if (closeButton) {
  closeButton.addEventListener('click', () => {
    window.location.href = '/';
  });
}

// Auto-focus on load and keep focus
window.addEventListener('load', () => {
  terminalInput.focus();
});

// Keep focus on terminal body click
terminalBody.addEventListener('click', () => {
  terminalInput.focus();
});

// Handle theme (check localStorage)
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
  document.body.classList.add('light-theme');
}
