// Example of using the updated captcha functionality with new fields
// This example shows how to save and retrieve captcha data with image, isUsed, and isCorrect fields

// Function to save a new captcha with image
async function saveCaptchaWithImage(key, value, imageBase64) {
  const captchaData = {
    key: key,
    value: value,
    image: imageBase64, // base64 encoded image
    isUsed: false, // initially not used
    isCorrect: false, // initially not verified as correct
    createtime: Date.now(),
    updatetime: Date.now()
  };

  // Send request to extension to save captcha data
  const result = await dbRequest('create', {
    key: key,
    value: captchaData,
    table: 'captcha'
  });

  if (result.success) {
    console.log('Captcha saved successfully');
    return result;
  } else {
    console.error('Failed to save captcha:', result.error);
    return null;
  }
}

// Function to mark a captcha as used
async function markCaptchaAsUsed(key) {
  const existingCaptcha = await dbRequest('read', {
    key: key,
    table: 'captcha'
  });

  if (existingCaptcha.success && existingCaptcha.value) {
    const updatedCaptcha = {
      ...existingCaptcha.value,
      isUsed: true,
      updatetime: Date.now()
    };

    const result = await dbRequest('update', {
      key: key,
      value: updatedCaptcha,
      table: 'captcha'
    });

    if (result.success) {
      console.log('Captcha marked as used');
      return result;
    } else {
      console.error('Failed to mark captcha as used:', result.error);
      return null;
    }
  }
}

// Function to mark a captcha as correct
async function markCaptchaAsCorrect(key) {
  const existingCaptcha = await dbRequest('read', {
    key: key,
    table: 'captcha'
  });

  if (existingCaptcha.success && existingCaptcha.value) {
    const updatedCaptcha = {
      ...existingCaptcha.value,
      isCorrect: true,
      updatetime: Date.now()
    };

    const result = await dbRequest('update', {
      key: key,
      value: updatedCaptcha,
      table: 'captcha'
    });

    if (result.success) {
      console.log('Captcha marked as correct');
      return result;
    } else {
      console.error('Failed to mark captcha as correct:', result.error);
      return null;
    }
  }
}

// Function to find unused captchas
async function findUnusedCaptchas() {
  const allCaptchas = await dbRequest('list', {
    table: 'captcha'
  });

  if (allCaptchas.success) {
    return allCaptchas.value.filter(captcha => !captcha.isUsed);
  }
  return [];
}

// Function to find correct captchas
async function findCorrectCaptchas() {
  const allCaptchas = await dbRequest('list', {
    table: 'captcha'
  });

  if (allCaptchas.success) {
    return allCaptchas.value.filter(captcha => captcha.isCorrect);
  }
  return [];
}

// Example usage:
// 1. Save a captcha with image
// const imageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
// await saveCaptchaWithImage('captcha_123', 'ABC123', imageBase64);

// 2. Mark as used when submitted
// await markCaptchaAsUsed('captcha_123');

// 3. Mark as correct if verification passes
// await markCaptchaAsCorrect('captcha_123');

// 4. Find unused captchas for reuse
// const unusedCaptchas = await findUnusedCaptchas();

// 5. Find correct captchas for analysis
// const correctCaptchas = await findCorrectCaptchas();

// Helper function for extension communication (from the existing example)
function dbRequest(op, { key, value, table = 'forms' } = {}) {
  return new Promise((resolve) => {
    function handler(event) {
      window.removeEventListener('extension-db-response', handler);
      resolve(event.detail);
    }
    window.addEventListener('extension-db-response', handler);
    window.dispatchEvent(new CustomEvent('extension-db-request', {
      detail: { op, key, value, table }
    }));
  });
} 