import { useRef, useCallback, useState } from "react";
import html2canvas from "html2canvas";

export function useExportImage() {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  const downloadAsImage = useCallback(async (filename: string) => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: "#0d0818",
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });
      const link = document.createElement("a");
      link.download = `huyen-bi-${filename}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const downloadAsText = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `huyen-bi-${filename}-${Date.now()}.txt`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const downloadAsPdf = useCallback(async (filename: string) => {
    if (!exportRef.current) return;
    setIsPdfExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: "#0d0818",
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });
      const { jsPDF } = await import("jspdf");
      const imgData = canvas.toDataURL("image/png");
      const imgW = canvas.width;
      const imgH = canvas.height;
      const pdfW = 210;
      const pdfH = (imgH / imgW) * pdfW;
      const pdf = new jsPDF({ orientation: pdfH > pdfW ? "portrait" : "landscape", unit: "mm", format: [pdfW, pdfH] });
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`huyen-bi-${filename}-${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsPdfExporting(false);
    }
  }, []);

  return { exportRef, downloadAsImage, downloadAsText, downloadAsPdf, isExporting, isPdfExporting };
}
