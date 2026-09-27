const uploadInput = document.getElementById('gallery-upload-input');
const uploadStatus = document.getElementById('gallery-upload-status');
const galleryGrid = document.querySelector('.gallery-grid');
const databaseName = 'brandon-united-gallery';
const storeName = 'uploads';
const maximumImageSize = 10 * 1024 * 1024;

function openGalleryDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readUploadedImages(database) {
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName).objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveUploadedImage(database, image) {
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName, 'readwrite').objectStore(storeName).put(image);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function deleteUploadedImage(database, id) {
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName, 'readwrite').objectStore(storeName).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function addUploadedImage(image, database) {
  const item = document.createElement('figure');
  const preview = document.createElement('img');
  const removeButton = document.createElement('button');
  const imageUrl = URL.createObjectURL(image.file);

  item.className = 'uploaded-gallery-item';
  preview.src = imageUrl;
  preview.alt = image.name;
  preview.loading = 'lazy';
  removeButton.type = 'button';
  removeButton.textContent = 'Remove';
  removeButton.setAttribute('aria-label', `Remove ${image.name}`);
  removeButton.addEventListener('click', async () => {
    removeButton.disabled = true;
    try {
      await deleteUploadedImage(database, image.id);
      URL.revokeObjectURL(imageUrl);
      item.remove();
      uploadStatus.textContent = `${image.name} removed.`;
    } catch {
      removeButton.disabled = false;
      uploadStatus.textContent = 'Could not remove this image. Please try again.';
    }
  });

  item.append(preview, removeButton);
  galleryGrid.append(item);
}

async function initializeGalleryUploads() {
  try {
    const database = await openGalleryDatabase();
    const images = await readUploadedImages(database);
    images.forEach((image) => addUploadedImage(image, database));

    uploadInput.addEventListener('change', async () => {
      const files = Array.from(uploadInput.files || []);
      let addedCount = 0;
      const rejectedFiles = [];

      for (const file of files) {
        if (!file.type.startsWith('image/') || file.size > maximumImageSize) {
          rejectedFiles.push(file.name);
          continue;
        }

        const image = {
          id: crypto.randomUUID(),
          name: file.name,
          file
        };

        try {
          await saveUploadedImage(database, image);
          addUploadedImage(image, database);
          addedCount += 1;
        } catch {
          uploadStatus.textContent = 'Could not save an image. Check available browser storage and try again.';
          break;
        }
      }

      if (addedCount && rejectedFiles.length) {
        uploadStatus.textContent = `${addedCount} image${addedCount === 1 ? '' : 's'} added. Skipped unsupported or over-10-MB files.`;
      } else if (addedCount) {
        uploadStatus.textContent = `${addedCount} image${addedCount === 1 ? '' : 's'} added.`;
      } else if (rejectedFiles.length) {
        uploadStatus.textContent = 'Choose image files that are 10 MB or smaller.';
      }

      uploadInput.value = '';
    });
  } catch {
    uploadInput.disabled = true;
    uploadStatus.textContent = 'Image uploads are not available in this browser.';
  }
}

initializeGalleryUploads();