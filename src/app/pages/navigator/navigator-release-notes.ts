export interface ReleaseNoteSection {
    title: string;
    items: string[];
}

export function extractReleaseNoteSections(body?: string): ReleaseNoteSection[] {
    const sections: ReleaseNoteSection[] = [];
    let currentSection: ReleaseNoteSection | null = null;
    let sawReleaseTitle = false;
    let sawSectionHeading = false;

    for (const rawLine of (body || '').split('\n')) {
        if (rawLine.trim() === '---') {
            break;
        }
        if (/^#\s+/.test(rawLine)) {
            if (sawReleaseTitle) {
                break;
            }
            sawReleaseTitle = true;
            continue;
        }
        const headingMatch = rawLine.match(/^##\s+(.+?)\s*$/);

        if (headingMatch) {
            sawSectionHeading = true;
            const title = headingMatch[1].trim();
            const isChangeSection = /^(highlights|added|changed|fixed|improvements(?: since .+)?)$/i.test(title);
            currentSection = isChangeSection ? {title, items: []} : null;

            if (currentSection) {
                sections.push(currentSection);
            }

            continue;
        }

        const itemMatch = rawLine.match(/^-\s+(.+?)\s*$/);
        if (!itemMatch) {
            continue;
        }

        if (!currentSection && !sawSectionHeading) {
            currentSection = {title: 'Changes', items: []};
            sections.push(currentSection);
        }
        currentSection?.items.push(cleanReleaseNoteMarkdown(itemMatch[1]));
    }

    return sections.filter(section => section.items.length > 0);
}

export function createReleaseHeadline(version: string): string {
    return version === 'Latest release'
        ? 'Latest release'
        : `Latest release: ${version}`;
}

export function extractReleaseSummary(body?: string): string {
    const summaryLines: string[] = [];

    for (const rawLine of (body || '').split('\n')) {
        const line = rawLine.trim();

        if (line === '---') {
            break;
        }

        if (!line || line.startsWith('#')) {
            if (summaryLines.length > 0) {
                break;
            }

            continue;
        }

        if (line.startsWith('-')) {
            if (summaryLines.length === 0) {
                return cleanReleaseNoteMarkdown(line.replace(/^-\s*/, ''))
                  .replace(/\s+/g, ' ');
            }

            break;
        }

        summaryLines.push(line);
    }

    if (summaryLines.length === 0) {
        return 'See the release notes below for current improvements.';
    }

    return cleanReleaseNoteMarkdown(summaryLines.join(' '))
        .replace(/\s+/g, ' ');
}

function cleanReleaseNoteMarkdown(value: string): string {
    return value
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/\s+—\s+/g, ' — ')
        .trim();
}
