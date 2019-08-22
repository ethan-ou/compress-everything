export const acceptedTypes = {
    'image/png': 'image',
    'image/jpeg': 'image',
    'image/svg+xml': 'image',
    'image/gif': 'image',
    'video/mp4': 'video',
    'video/x-m4v': 'video',
    'video/x-matroska': 'video',
    'video/quicktime': 'video',
    'video/mpeg': 'video',
    'application/zip': 'zip',
    'application/epub+zip': 'zip',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'zip', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'zip',
    'text/html': 'text',
    'text/css': 'text',
    'text/javascript': 'text',
    'application/javascript': 'text'
}

export const acceptedTypesArray = Object.keys(acceptedTypes);