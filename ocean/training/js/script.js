// 蓝色经济职业导航站实训手册 - 交互脚本

// 切换侧边栏
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// 复制代码
function copyCode(button) {
    const codeBlock = button.closest('.code-block');
    const codeContent = codeBlock.querySelector('.code-content');
    const text = codeContent.textContent;

    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = '已复制';
        button.style.background = '#10b981';
        button.style.color = 'white';

        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
            button.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('复制失败:', err);
    });
}

// 滚动高亮侧边栏
function highlightSidebar() {
    const sections = document.querySelectorAll('.section[id]');
    const sidebarLinks = document.querySelectorAll('.sidebar-link, .sidebar-sublink');

    let currentSection = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) {
            currentSection = section.getAttribute('id');
        }
    });

    sidebarLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// 平滑滚动
function smoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // 关闭移动端侧边栏
                const sidebar = document.getElementById('sidebar');
                if (sidebar && window.innerWidth <= 992) {
                    sidebar.classList.remove('open');
                }
            }
        });
    });
}

// 任务清单保存状态
function initTaskChecklist() {
    const checkboxes = document.querySelectorAll('.task-checklist__item input[type="checkbox"]');

    // 加载保存的状态
    checkboxes.forEach((checkbox, index) => {
        const key = `task-${window.location.pathname}-${index}`;
        const saved = localStorage.getItem(key);
        if (saved === 'true') {
            checkbox.checked = true;
        }

        // 保存状态变化
        checkbox.addEventListener('change', () => {
            localStorage.setItem(key, checkbox.checked);
        });
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    smoothScroll();
    highlightSidebar();
    initTaskChecklist();

    // 监听滚动
    window.addEventListener('scroll', highlightSidebar);

    // 添加复制按钮事件
    document.querySelectorAll('.code-copy').forEach(btn => {
        btn.addEventListener('click', () => copyCode(btn));
    });
});

// 点击外部关闭侧边栏
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.menu-toggle');

    if (sidebar && menuToggle) {
        if (window.innerWidth <= 992 &&
            !sidebar.contains(e.target) &&
            !menuToggle.contains(e.target) &&
            sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    }
});
