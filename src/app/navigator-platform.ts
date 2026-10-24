export function navigatorMinimumMacOS(version: string): number {
    const parts = version.replace(/^v/, '').split('.').map(Number);
    if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0)) {
        return 26;
    }
    const lastMacOS26Release = [0, 9, 1, 2];
    for (let index = 0; index < parts.length; index++) {
        if (parts[index] !== lastMacOS26Release[index]) {
            return parts[index] > lastMacOS26Release[index] ? 27 : 26;
        }
    }
    return 26;
}
