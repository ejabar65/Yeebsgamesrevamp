import { CLOAK_OPTIONS } from './constants';

export const applyCloak = (cloakName: string) => {
  const cloak = CLOAK_OPTIONS.find(c => c.name === cloakName) || CLOAK_OPTIONS[0];
  
  // Update Title
  document.title = cloak.title;
  
  // Update Favicon
  const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (link) {
    link.href = cloak.icon;
  } else {
    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.href = cloak.icon;
    document.head.appendChild(newLink);
  }
  
  localStorage.setItem('yeebsgames_cloak', cloakName);
};

export const getSavedCloak = () => {
  return localStorage.getItem('yeebsgames_cloak') || 'None (Default)';
};
