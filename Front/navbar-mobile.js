document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar    = document.getElementById('mobile-sidebar');
    const overlay    = document.getElementById('sidebar-overlay');
  
    // Debug rápido
    console.log('[navbar] menuToggle:', !!menuToggle, 'sidebar:', !!sidebar, 'overlay:', !!overlay);
  
    if (!menuToggle || !sidebar || !overlay) return;
  
    const openSidebar  = () => { sidebar.classList.add('active'); overlay.classList.add('active'); document.body.style.overflow='hidden'; };
    const closeSidebar = () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); document.body.style.overflow=''; };
  
    menuToggle.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openSidebar(); });
    overlay.addEventListener('click',  closeSidebar);
    // fecha ao apertar ESC
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSidebar(); });
  });
  