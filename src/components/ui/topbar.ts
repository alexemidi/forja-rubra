/**
 * Sincronização do Cabeçalho Unificado (Topbar) da Forja T20.
 */

export function sincronizarCabecalho(
  titulo: string,
  voltar: (() => void) | null
): void {
  const header = document.querySelector('.app-header,#forjaUnifiedTopbar');
  const menu = header?.querySelector('#drawerMenuBtn');
  const brand = header?.querySelector('.brand,.topbar-unified-brand');
  const label = header?.querySelector('.brand h1,.topbar-unified-brand h1');
  if (!header || !menu || !label) return;

  label.textContent = titulo;

  // Garante a logo à esquerda do título na topbar
  if (brand) {
    if (!brand.querySelector('img')) {
      const img = document.createElement('img');
      img.src = 'assets/favicon.svg';
      img.alt = '';
      img.width = 28;
      img.height = 28;
      img.style.cssText = 'width:28px;height:28px;vertical-align:middle;flex-shrink:0;';
      brand.prepend(img);
    }
    (brand as HTMLElement).style.display = 'inline-flex';
    (brand as HTMLElement).style.flexDirection = 'row';
    (brand as HTMLElement).style.alignItems = 'center';
    (brand as HTMLElement).style.gap = '10px';
  }
  (label as HTMLElement).style.fontFamily = "'Tormenta', 'Cinzel', Georgia, serif";

  // Garante que não haja duplicatas
  const allBackButtons = Array.from(header.querySelectorAll<HTMLButtonElement>('[data-header-back], .forja-topbar-back-btn, #topbarBackBtn'));
  if (allBackButtons.length > 1) {
    for (let i = 1; i < allBackButtons.length; i++) {
      allBackButtons[i].remove();
    }
  }

  let button = allBackButtons[0] || null;

  if (!voltar) {
    if (button && !header.id.includes('UnifiedTopbar')) {
      button.remove();
    }
    return;
  }

  if (!button) {
    button = document.createElement('button');
    button.id = 'topbarBackBtn';
    button.setAttribute('data-header-back', '');
    button.setAttribute('aria-label', 'Voltar');
    button.setAttribute('title', 'Voltar');
    button.setAttribute('type', 'button');
    button.innerHTML =
      '<span class="forja-return-arrow" aria-hidden="true"></span>';
    menu.before(button);
  } else {
    button.innerHTML =
      '<span class="forja-return-arrow" aria-hidden="true"></span>';
    button.style.color = '#dc2626';
  }

  button.onclick = voltar;

  if (!document.getElementById('forja-return-style')) {
    const style = document.createElement('style');
    style.id = 'forja-return-style';
    style.textContent =
      '[data-header-back],.forja-topbar-back-btn{display:inline-flex!important;align-items:center;justify-content:center;width:36px;height:36px;padding:7px!important;margin-right:6px;background:transparent!important;border:0!important;color:#dc2626!important;cursor:pointer;clip-path:none!important}.forja-return-arrow{display:block;width:18px;height:14px;border:2px solid currentColor;border-bottom:0;border-radius:11px 11px 0 0;position:relative}.forja-return-arrow:before{content:"";position:absolute;left:-5px;top:4px;width:7px;height:7px;border-left:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(-45deg)}';
    document.head.append(style);
  }
}
