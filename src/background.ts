declare const browser: any;

interface PageData {
  url: string;
  html: string;
}

async function captureCurrentPage(): Promise<PageData | null> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (!tab || !tab.id) {
    return null;
  }

  const url: string | undefined = tab.url;
  if (!url) {
    throw new Error("Tab has no URL");
  }

  const results = await browser.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.documentElement.outerHTML
  });


  const html: string = results[0].result as string;

  return { url, html };
}

async function sendToServer(data: PageData): Promise<boolean> {
  try {
    const response = await fetch('http://127.0.0.1:8080/save', {
      method: 'POST',
      headers: {
        'page-url': data.url
      },
      body: data.html
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to send:", error);
    return false;
  }
}

browser.commands.onCommand.addListener(async (command: string) => {
  if (command === "save-page") {
    const pageData = await captureCurrentPage();

    if (!pageData) {
      console.error("Failed to capture page");
      return;
    }

    const success = await sendToServer(pageData);

    if (success) {
      console.log("Page saved successfully");
    } else {
      console.error("Failed to save page");
    }
  }
});
