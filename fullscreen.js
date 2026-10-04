(() => {
  const button = document.querySelector('#fullscreen');
  const root = document.documentElement;
  const enter = root.requestFullscreen || root.webkitRequestFullscreen;
  const leave = document.exitFullscreen || document.webkitExitFullscreen;
  const active = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  if (!enter || !leave || document.fullscreenEnabled === false) {
    button.hidden = true;
    return;
  }
  function sync() {
    const expanded = active();
    const label = expanded ? 'Exit fullscreen' : 'Enter fullscreen';
    button.setAttribute('aria-pressed', String(expanded));
    button.setAttribute('aria-label', label);
    button.title = label;
  }
  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    try {
      if (active()) await leave.call(document);
      else await enter.call(root);
    } catch {
      // A denied request leaves gameplay and the current browser view intact.
    } finally {
      button.disabled = false;
      sync();
    }
  });
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);
  sync();
})();
