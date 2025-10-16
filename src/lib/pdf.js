import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generateInventoryPDF({ meta, rows }) {
	const pdfDoc = await PDFDocument.create();
	const page = pdfDoc.addPage();
	const { width } = page.getSize();
	const margin = 40;
	let y = page.getHeight() - margin;

	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

	// Title
	const title = "Inventory Stock Report";
	const titleSize = 18;
	const titleWidth = bold.widthOfTextAtSize(title, titleSize);
	page.drawText(title, { x: (width - titleWidth) / 2, y, size: titleSize, font: bold });
	y -= 30;

	// Meta
	const metaLines = [
		`Generated: ${meta.generatedAt}`,
		`Date Range: ${meta.dateFrom || "Not set"} - ${meta.dateTo || "Not set"}`,
		`Department: ${meta.department}`,
		`Region: ${meta.region}`,
	];
	metaLines.forEach((line) => {
		page.drawText(line, { x: margin, y, size: 10, font });
		y -= 14;
	});
	y -= 6;

	// Table headers
	const headers = ["Item Name", "Category", "Quantity", "Unit", "Branch", "Warehouse"];
	const colWidths = [150, 80, 60, 60, 80, 80];
	let x = margin;
	headers.forEach((h, i) => {
		page.drawText(h, { x, y, size: 11, font: bold });
		x += colWidths[i];
	});
	y -= 16;

	// Divider
	page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
	y -= 10;

	// Rows (simple pagination)
	const rowHeight = 14;
	for (const row of rows) {
		if (y < margin + 40) {
			// new page
			const newPage = pdfDoc.addPage();
			y = newPage.getHeight() - margin;
			x = margin;
			headers.forEach((h, i) => {
				newPage.drawText(h, { x, y, size: 11, font: bold });
				x += colWidths[i];
			});
			y -= 26;
			page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
			y -= 10;
		}
		x = margin;
		const values = [
			row.inventory_item?.name || "-",
			row.inventory_item?.category || "-",
			String(row.qty ?? "-"),
			row.inventory_item?.unit_measurement || "-",
			row.branch?.name || "-",
			row.warehouse?.name || "-",
		];
		values.forEach((val, i) => {
			page.drawText(val, { x, y, size: 10, font });
			x += colWidths[i];
		});
		y -= rowHeight;
	}

	const bytes = await pdfDoc.save();
	return Buffer.from(bytes);
}

export async function generateGenericPDF({ title = "Custom Report", meta }) {
	const pdfDoc = await PDFDocument.create();
	const page = pdfDoc.addPage();
	const { width } = page.getSize();
	const margin = 40;
	let y = page.getHeight() - margin;

	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

	const titleSize = 18;
	const titleWidth = bold.widthOfTextAtSize(title, titleSize);
	page.drawText(title, { x: (width - titleWidth) / 2, y, size: titleSize, font: bold });
	y -= 30;

	const metaLines = [
		`Generated: ${meta.generatedAt}`,
		`Date Range: ${meta.dateFrom || "Not set"} - ${meta.dateTo || "Not set"}`,
		`Department: ${meta.department}`,
		`Region: ${meta.region}`,
	];
	metaLines.forEach((line) => {
		page.drawText(line, { x: margin, y, size: 12, font });
		y -= 18;
	});
	y -= 12;

	const note = "This report type is not yet connected to a data source. Please configure backend queries to include dataset rows.";
	page.drawText(note, { x: margin, y, size: 11, font });

	const bytes = await pdfDoc.save();
	return Buffer.from(bytes);
}


