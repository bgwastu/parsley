import type { OutputFormat } from "@/types/output";

export interface SchemaGenerationContext {
	filename?: string;
	mimeType?: string;
	jsonType?: "object" | "array";
}

export function getSchemaGenerationPrompt(
	format: OutputFormat,
	context?: SchemaGenerationContext,
): string {
	const { filename, mimeType } = context || {};
	
	// Build context hints from filename
	const filenameHints = filename
		? `\n\nDocument filename: "${filename}"`
		: "";
	
	const mimeTypeHint = mimeType
		? `\nDocument type: ${mimeType}`
		: "";

	const contextSection = filenameHints || mimeTypeHint
		? `\n## Document Context${filenameHints}${mimeTypeHint}\n\nUse the filename and document content to infer:\n- What type of document this is (invoice, receipt, contract, form, report, etc.)\n- Why someone would upload this document (what business need it serves)\n- What kind of data extraction would be most valuable\n- Common patterns and fields for this document type`
		: "";

	switch (format) {
		case "json": {
			const jsonType = context?.jsonType ?? "object";
			
			if (jsonType === "array") {
				return `You are an expert at analyzing documents and creating data extraction schemas. Your goal is to identify REPEATING OBJECTS or ITEMS in the document that should be extracted as an array.${contextSection}

## Your Task

1. **Document Analysis**: 
   - Identify the document type and purpose (e.g., invoice, receipt, contract, form, medical record, legal document, etc.)
   - Understand the business context: Why would someone upload this? What problem are they trying to solve?
   - Look for REPEATING PATTERNS or MULTIPLE INSTANCES of similar objects/items in the document

2. **Array Identification Strategy**:
   - **CRITICAL**: Identify what objects or items in the document appear MULTIPLE TIMES or form a REPEATING PATTERN
   - Look for:
     * Lists of items (invoice line items, transaction entries, product listings, etc.)
     * Repeating sections (multiple addresses, multiple contacts, multiple entries)
     * Tabular data that represents multiple records
     * Any collection of similar objects that would naturally be an array
   - Determine what constitutes ONE ITEM in the array (e.g., one invoice line item, one transaction, one product)
   - Think about what fields each array item should have

3. **Schema Design for Array Format**:
   - The output will be an ARRAY of objects, where each object represents one item from the repeating pattern
   - For each object in the array, define the fields that describe that item:
     * The field name (in camelCase, descriptive and meaningful)
     * The data type (string, number, boolean, date, array, or object for nested structures)
     * Whether it's required (present in most items)
     * For array fields within an item, specify the item type
     * For object fields within an item, specify the nested children fields
   - Include fields that help identify or categorize each item (e.g., itemNumber, description, amount)
   - If the document has metadata (like invoice number, date, total) that applies to ALL items, you can include those as fields in each object, OR focus only on the item-specific fields

4. **Quality Considerations**:
   - Ensure the schema captures all important information for each array item
   - Think about what fields would be useful for filtering, sorting, or analyzing the array
   - Consider what makes each item unique or identifiable
   - Make field names intuitive and self-documenting

**IMPORTANT**: Return a schema that defines the STRUCTURE OF ONE OBJECT in the array. The AI will extract ALL matching objects from the document and return them as an array. Focus on identifying what should be repeated in the array.`;
			}
			
			// Object format (default)
			return `You are an expert at analyzing documents and creating data extraction schemas. Your goal is to understand WHY the user uploaded this document and WHAT data they want to extract.${contextSection}

## Your Task

1. **Document Analysis**: 
   - Identify the document type and purpose (e.g., invoice, receipt, contract, form, medical record, legal document, etc.)
   - Understand the business context: Why would someone upload this? What problem are they trying to solve?
   - Consider common use cases for this document type

2. **Data Extraction Strategy**:
   - Think about what data points would be most valuable to extract
   - Consider what users typically need from this type of document
   - Identify both explicit data (clearly visible) and implicit data (can be derived)
   - Think about downstream use cases (reporting, analysis, automation, etc.)

3. **Schema Design**:
   - Create a comprehensive nested JSON schema that captures all important information
   - Use logical groupings (e.g., customer info, items, totals, metadata)
   - For each field, determine:
     * The field name (in camelCase, descriptive and meaningful)
     * The data type (string, number, boolean, date, array, or object for nested structures)
     * Whether it's required (present in most similar documents of this type)
     * For array fields, specify the item type
     * For object fields, specify the nested children fields
   - Include fields that would be useful even if not immediately visible (e.g., documentType, processedDate)

4. **Quality Considerations**:
   - Ensure the schema is practical and useful for real-world scenarios
   - Include fields that enable common operations (filtering, sorting, grouping)
   - Consider edge cases and variations in similar documents
   - Make field names intuitive and self-documenting

Return a comprehensive nested JSON schema that captures all important information in the document, designed with the user's likely intent in mind.`;
		}

		case "csv":
			return `You are an expert at analyzing documents and creating data extraction schemas. Your goal is to identify REPEATING OBJECTS or ITEMS in the document that should be extracted as a list (CSV format).${contextSection}

## Your Task

1. **Document Analysis**: 
   - Identify the document type and purpose (e.g., invoice, receipt, contract, form, report, etc.)
   - Understand the business context: Why would someone upload this? What problem are they trying to solve?
   - Look for REPEATING PATTERNS or MULTIPLE INSTANCES of similar objects/items in the document

2. **List/Array Identification Strategy**:
   - **CRITICAL**: Identify what objects or items in the document appear MULTIPLE TIMES or form a REPEATING PATTERN
   - Look for:
     * Lists of items (invoice line items, transaction entries, product listings, etc.)
     * Repeating sections (multiple addresses, multiple contacts, multiple entries)
     * Tabular data that represents multiple records
     * Any collection of similar objects that would naturally be a list
   - Determine what constitutes ONE RECORD in the CSV (e.g., one invoice line item, one transaction, one product)
   - Think about what columns each record should have

3. **Column Design for CSV List Format**:
   - The output will be a LIST/ARRAY of records, where each record represents one item from the repeating pattern
   - Create a flat list of columns suitable for CSV export
   - For each column, determine:
     * The column name (human-readable header, clear and descriptive)
     * The data type (string, number, boolean, or date)
     * Whether it's required (present in most records)
   - Include identifier columns (IDs, reference numbers) that help identify each record
   - Include fields that help identify or categorize each item (e.g., itemNumber, description, amount)
   - If the document has metadata (like invoice number, date, total) that applies to ALL records, you can include those as columns in each record, OR focus only on the item-specific columns
   - Do NOT include nested structures - flatten everything into columns

4. **Quality Considerations**:
   - Ensure columns are practical for spreadsheet analysis
   - Think about what pivot tables or reports users might create
   - Consider what fields would be useful for filtering, sorting, or analyzing the list
   - Consider what makes each record unique or identifiable
   - Make column names intuitive for non-technical users

**IMPORTANT**: Return a schema that defines the COLUMNS FOR ONE RECORD in the list. The AI will extract ALL matching records from the document and return them as a CSV list. Focus on identifying what should be repeated in the list and what columns each record should have.`;
	}
}

export function getParsePrompt(
	format: OutputFormat,
	customPrompt?: string,
	jsonType?: "object" | "array",
): string {
	let base: string;
	
	if (format === "json") {
		if (jsonType === "array") {
			base = "Extract ALL matching objects from the document(s) as an array. Each object in the array should match the provided schema. Look for repeating patterns or multiple instances of similar objects in the document and extract each one as a separate array element.";
		} else {
			base = "Extract the structured data from the document(s) as nested JSON matching the provided schema.";
		}
	} else {
		base = "Extract the data from the document(s) as a flat array of records suitable for CSV export. Each record should match the provided column schema.";
	}

	return customPrompt
		? `${base}\n\nAdditional instructions: ${customPrompt}`
		: base;
}
