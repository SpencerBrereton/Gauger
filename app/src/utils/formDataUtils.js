import { Platform } from 'react-native';

/**
 * Appends a file to FormData in a platform-compatible way.
 * 
 * @param {FormData} formData 
 * @param {string} key 
 * @param {object} fileData - { uri, name, type }
 */
export const appendFile = async (formData, key, fileData) => {
    if (!fileData || !fileData.uri) return;

    if (Platform.OS === 'web') {
        const response = await fetch(fileData.uri);
        const blob = await response.blob();
        formData.append(key, blob, fileData.name || 'file.jpg');
    } else {
        formData.append(key, {
            uri: fileData.uri,
            name: fileData.name || 'file.jpg',
            type: fileData.type || 'image/jpeg',
        });
    }
};
