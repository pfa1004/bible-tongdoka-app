import html2canvas from 'html2canvas';

/**
 * DOM 카드 요소를 2x 고해상도 Canvas로 변환하여 Blob 형태로 반환합니다.
 */
export async function generateVerseCardImage(
  element: HTMLElement,
  scale: number = 2
): Promise<Blob | null> {
  try {
    const rect = element.getBoundingClientRect();
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      width: rect.width,
      height: rect.height,
      windowWidth: element.ownerDocument.defaultView?.innerWidth || 1200,
      windowHeight: element.ownerDocument.defaultView?.innerHeight || 800,
      ignoreElements: (el) => el.tagName === 'SCRIPT' || el.tagName === 'STYLE',
      onclone: (clonedDoc, clonedEl) => {
        // Ensure cloned element matches live element exactly
        clonedEl.style.width = `${rect.width}px`;
        clonedEl.style.height = `${rect.height}px`;
        clonedEl.style.maxWidth = 'none';
        clonedEl.style.maxHeight = 'none';
        clonedEl.style.margin = '0 auto';
        clonedEl.style.boxSizing = 'border-box';
        clonedEl.style.transform = 'none';
      },
    });

    return new Promise((resolve) => {
      try {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              // Fallback to DataURL
              const dataUrl = canvas.toDataURL('image/png');
              const arr = dataUrl.split(',');
              const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
              const bstr = atob(arr[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
              }
              resolve(new Blob([u8arr], { type: mime }));
            }
          },
          'image/png',
          1.0
        );
      } catch (err) {
        try {
          const dataUrl = canvas.toDataURL('image/png');
          const arr = dataUrl.split(',');
          const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          resolve(new Blob([u8arr], { type: mime }));
        } catch (e2) {
          console.error('Final canvas conversion error:', e2);
          resolve(null);
        }
      }
    });
  } catch (error) {
    console.error('말씀 카드 이미지 생성 실패:', error);
    return null;
  }
}

/**
 * Blob 이미지 데이터를 PNG 파일로 다운로드합니다.
 */
export function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * 텍스트를 클립보드에 복사합니다.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for browsers without Clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('클립보드 복사 오류:', err);
    return false;
  }
}

/**
 * 스마트폰 기본 공유 기능(Web Share API)을 호출하거나 폴백 다운로드/클립보드 복사를 실행합니다.
 */
export async function shareToSNS(
  title: string,
  text: string,
  imageBlob?: Blob | null,
  filename: string = '말씀카드.png'
): Promise<{ success: boolean; method: 'native_share' | 'clipboard' | 'download' }> {
  try {
    const file = imageBlob ? new File([imageBlob], filename, { type: 'image/png' }) : null;

    // 1. Web Share API with File payload (Supported on Android Chrome, Safari iOS)
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      // 모바일(특히 안드로이드 카카오톡)에서 text와 files를 동시에 보내면 
      // 이미지가 누락되고 텍스트만 공유되는 현상이 있습니다.
      // 이를 방지하기 위해 텍스트는 클립보드에 자동 복사하고, 공유는 파일만 전달합니다.
      await copyToClipboard(text);
      
      await navigator.share({
        title: title,
        files: [file],
        // text는 의도적으로 제외하여 앱이 파일(이미지) 공유로 확실히 인식하게 함
      });
      return { success: true, method: 'native_share' };
    }

    // 2. Try copying image directly to Clipboard (Supported on iOS & modern Chrome)
    if (imageBlob && navigator.clipboard && navigator.clipboard.write) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': imageBlob })
        ]);
        if (text) await copyToClipboard(text);
        return { success: true, method: 'clipboard' };
      } catch (clipErr) {
        console.warn('ClipboardItem write failed, falling back to download:', clipErr);
      }
    }

    // 3. Fallback: Copy text & trigger PNG image download
    const copied = await copyToClipboard(text);
    if (imageBlob) {
      downloadImage(imageBlob, filename);
    }
    return { success: copied, method: imageBlob ? 'download' : 'clipboard' };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, method: 'native_share' };
    }
    console.warn('SNS 공유 오류, 폴백 적용:', error);
    const copied = await copyToClipboard(text);
    if (imageBlob) {
      downloadImage(imageBlob, filename);
    }
  }
}
