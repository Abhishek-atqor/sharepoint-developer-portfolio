import * as React from "react";
import { SPFx, spfi } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import * as XLSX from "xlsx";
import { DefaultButton, DetailsList, IColumn } from "office-ui-fabric-react";
import { IExcelToSpListProps } from "./IExcelToSpListProps";

export interface IExcelToSPListState {
  excelData: any[];
  columns: IColumn[];
  loading: boolean;
  fileName: string;
}

export default class ExcelToSPList extends React.Component<
  IExcelToSpListProps,
  IExcelToSPListState
> {
  constructor(props: IExcelToSpListProps) {
    super(props);
    this.state = {
      excelData: [],
      columns: [],
      loading: false,
      fileName: "",
    };
  }

  handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      this.setState({ fileName: file.name.split(".")[0] }); // Extract the file name without the extension
      reader.onload = async (e: ProgressEvent<FileReader>) => {
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        if (jsonData.length > 0) {
          const columns = Object.keys(jsonData[0]).map((key) => ({
            key,
            name: key,
            fieldName: key,
            minWidth: 100,
            maxWidth: 200,
            isResizable: true,
          }));
          this.setState({ excelData: jsonData, columns });
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  createListAndUploadData = async () => {
    const { fileName, excelData } = this.state;
    if (!fileName || excelData.length === 0) {
      alert("No file uploaded or data to process.");
      return;
    }

    const sp = spfi().using(SPFx(this.props.context));

    try {
      this.setState({ loading: true });

      // Step 1: Create the SharePoint List dynamically using the file name
      const listResponse = await sp.web.lists.add(fileName, "", 100); // 100 represents Custom List
      const list = sp.web.lists.getByTitle(fileName); // Get the list object

      // Step 2: Create columns dynamically based on Excel file columns
      const firstRow = excelData[0];
      for (const key of Object.keys(firstRow)) {
        const value = firstRow[key];

        // Check the type of the value and create a column accordingly
        if (typeof value === "string") {
          await list.fields.addText(key);
        } else if (typeof value === "number") {
          await list.fields.addNumber(key);
        } else if (value instanceof Date) {
          await list.fields.addDateTime(key);
        } else {
          // Default case - treat as text
          await list.fields.addText(key);
        }
      }

      // Step 3: Upload the data into the SharePoint list
      for (const item of excelData) {
        await list.items.add(item); // Add each row from Excel data to the list
      }

      alert(`SharePoint list '${fileName}' created and data uploaded successfully!`);
    } catch (error) {
      console.error("Error:", error);
      alert("Error occurred. Please check the console for details.");
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { excelData, columns, loading } = this.state;

    return (
      <div>
        <h2>Excel to SharePoint List Dashboard</h2>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={this.handleFileUpload}
        />
        <DefaultButton
          text={loading ? "Processing..." : "Create List and Upload Data"}
          onClick={this.createListAndUploadData}
          disabled={loading || excelData.length === 0}
        />
        <h3>Preview Data</h3>
        <DetailsList
          items={excelData}
          columns={columns}
          setKey="set"
          layoutMode={0}
        />
      </div>
    );
  }
}
