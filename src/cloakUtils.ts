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

export const launchAboutBlank = () => {
  const url = window.location.href;
  const win = window.open();
  if (!win) {
    alert('Pop-up blocked! Please allow pop-ups to use About:Blank cloaking.');
    return;
  }
  
  win.document.body.style.margin = '0';
  win.document.body.style.height = '100vh';
  
  const iframe = win.document.createElement('iframe');
  iframe.style.border = 'none';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.margin = '0';
  iframe.src = url;
  
  win.document.body.appendChild(iframe);
  
  // Redirect original tab to a safe site
  window.location.replace('https://google.com');
};
