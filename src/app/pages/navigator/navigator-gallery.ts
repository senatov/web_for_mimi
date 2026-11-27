export interface GalleryImageItem {
    itemImageSrc: string;
    thumbnailImageSrc: string;
    alt: string;
    title: string;
    width: number;
    height: number;
}

export const navigatorImageBasePath = '/images';

const galleryImageSpecs = [
    ['navigator/gallery/001.png', 'MiMiNavigator Dual Panel Workspace', 1353, 1258],
    ['navigator/gallery/002.png', 'MiMiNavigator Advanced File Search', 967, 900],
    ['navigator/gallery/003.png', 'MiMiNavigator Media Converter Video', 1528, 1394],
    ['navigator/gallery/004.png', 'MiMiNavigator Favorites', 1870, 1418],
    ['navigator/gallery/005.png', 'MiMiNavigator Panel Settings', 1870, 1418],
    ['navigator/gallery/006.png', 'MiMiNavigator Cloud Share+Link Settings', 1870, 1418],
    ['navigator/gallery/007.png', 'MiMiNavigator External Tools Diagnostics', 1156, 836],
    ['navigator/gallery/008.png', 'MiMiNavigator Permissions Settings', 1156, 836],
    ['navigator/gallery/009.png', 'MiMiNavigator Diff Tool Details', 1156, 836],
    ['navigator/gallery/010.png', 'MiMiNavigator Panel Settings', 1878, 1405],
    ['navigator/gallery/011.png', 'MiMiNavigator Saved Server Editor', 1870, 1418],
    ['navigator/gallery/012.png', 'MiMiNavigator Diff Tool Settings', 1878, 1405],
    ['navigator/gallery/013.png', 'MiMiNavigator Path Completion', 1878, 1405],
    ['navigator/gallery/014.png', 'MiMiNavigator Connections Menu', 1544, 1415],
    ['navigator/gallery/015.png', 'MiMiNavigator Network Neighborhood', 1878, 1405],
    ['navigator/gallery/016.png', 'MiMiNavigator Column Presets', 1878, 1405],
    ['navigator/gallery/017.png', 'MiMiNavigator Sidebar And Dual Panels', 640, 491],
    ['navigator/gallery/018.png', 'MiMiNavigator File Preview Panel', 1870, 1418],
    ['navigator/gallery/019.png', 'MiMiNavigator Media Converter Gif', 1528, 1394],
    ['navigator/gallery/020.png', 'MiMiNavigator Media Converter', 1528, 1394],
    ['navigator/gallery/021.png', 'MiMiNavigator Network Settings', 1878, 1405]
] as const;

export const navigatorGalleryImages: GalleryImageItem[] = galleryImageSpecs.map(([path, title, width, height]) => {
    const imageUrl = `${navigatorImageBasePath}/${path}`;
    return {itemImageSrc: imageUrl, thumbnailImageSrc: imageUrl, alt: title, title, width, height};
});
