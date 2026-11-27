export interface HighlightCard {
    title: string;
    icon: string;
    emoji: string;
    description: string;
    commitUrl: string;
}

const navigatorCommit = 'https://github.com/senatov/MiMiNavigator/commits/main/';
const portalCommit = 'https://github.com/senatov/web_for_mimi/commit/da7d83b';
export const productDetailCards: HighlightCard[] = [
    {
        title: 'Free',
        icon: 'check_circle',
        emoji: '🎈',
        description: 'No purchase, subscription, or feature paywall. The portal presents the app as a free download and links directly to its current release.',
        commitUrl: portalCommit
    },
    {
        title: 'Signed & notarized',
        icon: 'verified_user',
        emoji: '🛡️',
        description: 'The downloadable DMG is Developer ID signed and notarized by Apple. macOS can verify the publisher and the notarization before you open it.',
        commitUrl: navigatorCommit
    },
    {
        title: 'Native macOS',
        icon: 'desktop_mac',
        emoji: '🍎',
        description: 'MiMiNavigator is a SwiftUI and AppKit desktop app. The current release requires macOS 27 or newer; v0.9.1.2 is the final macOS 26 version.',
        commitUrl: portalCommit
    },
    {
        title: 'Open source',
        icon: 'code',
        emoji: '🔎',
        description: 'The app source is public on GitHub. You can inspect implementation and release history, while the portal keeps published release information linked to GitHub.',
        commitUrl: portalCommit
    }
];

export const coreToolCards: HighlightCard[] = [
    {
        title: 'Dual panels',
        icon: 'view_column',
        emoji: '🧭',
        description: 'Keep two locations visible at once. Move or compare files while each panel retains its own tabs and browsing context.',
        commitUrl: navigatorCommit
    },
    {
        title: 'Find & clean',
        icon: 'manage_search',
        emoji: '🕵️',
        description: 'Find files by name or document content, then review large, empty, or leftover items. Cleanup guides explain scan scope, saved progress, and review before action.',
        commitUrl: portalCommit
    },
    {
        title: 'Multi-Rename',
        icon: 'drive_file_rename_outline',
        emoji: '✏️',
        description: 'Build structured filename changes for a group of files and inspect the proposed names before applying them.',
        commitUrl: navigatorCommit
    },
    {
        title: 'Remote servers',
        icon: 'dns',
        emoji: '🛰️',
        description: 'Save FTP and SFTP connections and browse remote locations alongside local folders. Connection details can be revisited from the app.',
        commitUrl: navigatorCommit
    },
    {
        title: 'Archives',
        icon: 'folder_zip',
        emoji: '📦',
        description: 'Open supported archives as folder-like locations, so you can inspect and work with their contents without first extracting everything.',
        commitUrl: navigatorCommit
    },
    {
        title: 'Media tools',
        icon: 'perm_media',
        emoji: '🎞️',
        description: 'Convert images, audio, and video in a focused workflow. The portal’s media guide describes supported formats and the practical steps.',
        commitUrl: portalCommit
    }
];
