export interface ReleaseCommit {
    hash: string;
    subject: string;
    details: string;
}

export function parseReleaseCommits(body: string): ReleaseCommit[] {
    const commits: ReleaseCommit[] = [];
    for (const line of body.split(/\r?\n/)) {
        const match = /^- \*\*(.+)\*\* \(\x60([0-9a-f]{8,40})\x60\)$/.exec(line);
        if (match) {
            commits.push({subject: match[1], hash: match[2], details: ''});
        } else if (commits.length && line.startsWith('  >')) {
            const text = line.slice(3).trim();
            commits[commits.length - 1].details += text ? `${text} ` : '\n';
        }
    }
    return commits.map(commit => ({...commit, details: commit.details.trim()}));
}
