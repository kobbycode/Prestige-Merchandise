/**
 * Converts Firebase error codes to human-readable messages
 */
export const getFirebaseErrorMessage = (error: any): string => {
    const errorCode = error.code || '';

    const errorMessages: Record<string, string> = {
        // Auth errors
        'auth/requires-recent-login': 'For security, please log out and log back in before changing your password.',
        'auth/wrong-password': 'Current password is incorrect.',
        'auth/weak-password': 'Password must be at least 6 characters long.',
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/invalid-credential': 'Invalid login credentials. Please check your email and password.',
        'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',

        // Firestore errors
        'permission-denied': 'You don\'t have permission to perform this action.',
        'not-found': 'The requested resource was not found.',
        'already-exists': 'This resource already exists.',
        'failed-precondition': 'Operation failed. Please try again.',
        'unavailable': 'Service temporarily unavailable. Please try again later.',

        // Storage errors
        'storage/unauthorized': 'You don\'t have permission to access this file.',
        'storage/object-not-found': 'File not found.',
        'storage/quota-exceeded': 'Storage quota exceeded.',

        // Default
        'default': 'An error occurred. Please try again.'
    };

    return errorMessages[errorCode] || error.message || errorMessages['default'];
};
