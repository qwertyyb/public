export function createAutoResizeInput(input: HTMLInputElement & { autoResizeInstance?: { destroy: () => void } }) {
    // 如果已经存在实例，先销毁
    if (input.autoResizeInstance) {
      input.autoResizeInstance.destroy()
    }
    
    // 创建测量元素
    const span = document.createElement('span');
    span.className = 'measure-span';
    span.style.cssText = `
        position: absolute !important;
        visibility: hidden !important;
        white-space: pre !important;
        padding: 0 !important;
        pointer-events: none !important;
        z-index: -9999 !important;
    `;
    document.body.appendChild(span);
    
    
    // 初始参数
    const minWidth = parseInt(input.getAttribute('data-min') || '30');
    const maxWidth = parseInt(input.getAttribute('data-max') || '700');
    
    let resizeObserver: ResizeObserver
    
    // 调整宽度函数
    function resizeInput() {
        // 更新活动时间
        instance.lastUsed = Date.now();
        
        const text = input.value || input.placeholder || '';
        const style = window.getComputedStyle(input);
        
        // 复制样式
        span.style.font = style.font;
        span.style.letterSpacing = style.letterSpacing;
        span.style.textTransform = style.textTransform;
        span.style.padding = style.padding;
        span.style.fontSize = style.fontSize;
        span.style.fontFamily = style.fontFamily;
        span.style.fontWeight = style.fontWeight;
        
        span.textContent = text;
        
        // 计算真实宽度
        const extra = 4; // 光标空间
        let width = span.offsetWidth + extra;
        
        // 应用最小和最大限制
        width = Math.min(maxWidth, Math.max(minWidth, width));
        input.style.width = `${width}px`;
    }
    
    // 设置自动清理的销毁方法
    function destroy() {
        // 清理事件监听器
        input.removeEventListener('input', resizeInput);
        window.removeEventListener('resize', resizeInput);
        input.removeEventListener('focus', resizeInput);
        
        // 清理ResizeObserver
        if (resizeObserver) {
            resizeObserver.unobserve(input);
            resizeObserver.disconnect();
        }
        
        // 删除测量元素
        if (span && span.parentNode) {
            span.parentNode.removeChild(span);
        }
    }
    
    // 初始化
    const instance = {
        input,
        minWidth,
        maxWidth,
        lastUsed: Date.now(),
        resize: resizeInput,
        destroy
    };
    
    // 设置事件监听器
    input.addEventListener('input', resizeInput);
    window.addEventListener('resize', resizeInput);
    input.addEventListener('focus', resizeInput);
    
    // 添加ResizeObserver
    if (window.ResizeObserver) {
        resizeObserver = new ResizeObserver(resizeInput);
        resizeObserver.observe(input);
    }
    
    // 初始调整尺寸
    resizeInput();

    input.autoResizeInstance = instance
    
    return instance;
}

export const resourceUrl = (urlOrPath: string | undefined, basePath: string) => {
    console.log('reousrceUrl', urlOrPath)
    if (!urlOrPath || /^\w+:\/\//.test(urlOrPath) || urlOrPath.startsWith('data:')) {
        return urlOrPath
    }
    let path = urlOrPath
    if (!urlOrPath.startsWith('/')) {
        path = window.publicApp.utils.pathJoin(basePath, urlOrPath)
    }
    return `ipublic://public.qwertyyb.com/local-file?path=${encodeURIComponent(path)}`
}