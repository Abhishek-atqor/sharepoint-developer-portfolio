import * as React from 'react';
import styles from './DynamicFormsBuilder.module.scss';
import type { IDynamicFormsBuilderProps } from './IDynamicFormsBuilderProps';
import { spfi, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/fields';
import { DefaultButton, TextField, Dropdown, IDropdownOption } from "office-ui-fabric-react";

export interface IField {
  id: string;
  label: string;
  type: string;
  options?: string[]; // For dropdown fields
  value?: string; // Stores the selected value
}

export interface IDynamicFormsBuilderState {
  fields: IField[];
  newFieldLabel: string;
  newFieldType: string;
  newDropdownOptions: string;
}

export default class DynamicFormsBuilder extends React.Component<IDynamicFormsBuilderProps, IDynamicFormsBuilderState> {
  private sp: ReturnType<typeof spfi>;

  constructor(props: IDynamicFormsBuilderProps) {
    super(props);

    this.state = {
      fields: [],
      newFieldLabel: "",
      newFieldType: "",
      newDropdownOptions: "",
    };

    this.sp = spfi().using(SPFx(this.props.context));
  }

  handleAddField = () => {
    const { newFieldLabel, newFieldType, newDropdownOptions, fields } = this.state;

    if (!newFieldLabel || !newFieldType) {
      alert("Please provide both label and type for the field.");
      return;
    }

    const newField: IField = {
      id: `${newFieldType}-${Date.now()}`,
      label: newFieldLabel,
      type: newFieldType,
      options: newFieldType === "Dropdown" ? newDropdownOptions.split(",") : undefined,
    };

    this.setState({
      fields: [...fields, newField],
      newFieldLabel: "",
      newFieldType: "",
      newDropdownOptions: "",
    });
  };

  handleFieldChange = (id: string, value: string) => {
    const updatedFields = this.state.fields.map((field) => {
      if (field.id === id) {
        field.value = value;
      }
      return field;
    });
    this.setState({ fields: updatedFields });
  };

  handleSaveToSharePoint = async () => {
    const { fields } = this.state;

    try {
      const addPromises = fields.map((field) =>
        this.sp.web.lists.getByTitle("DynamicFormResponses").items.add({
          Title: "Form Response",
          FieldName: field.label,
          FieldType: field.type,
          FieldValue: field.value || "",
        })
      );

      await Promise.all(addPromises);
      alert("Form data saved successfully!");
    } catch (error) {
      console.error("Error saving data to SharePoint:", error);
      alert("Failed to save form data.");
    }
  };

  renderFieldInput = (field: IField) => {
    switch (field.type) {
      case "TextField":
        return (
          <TextField
            label={field.label}
            value={field.value || ""}
            onChange={(e, value) => this.handleFieldChange(field.id, value || "")}
          />
        );
      case "Dropdown":
        return (
          <Dropdown
            label={field.label}
            options={(field.options || []).map((opt) => ({ key: opt, text: opt }))}
            selectedKey={field.value}
            onChange={(e, option) => this.handleFieldChange(field.id, option?.key as string)}
          />
        );
      default:
        return <p>Unsupported field type</p>;
    }
  };

  public render(): React.ReactElement<IDynamicFormsBuilderProps> {
    const { fields, newFieldLabel, newFieldType, newDropdownOptions } = this.state;

    const fieldTypeOptions: IDropdownOption[] = [
      { key: "TextField", text: "Text Field" },
      { key: "Dropdown", text: "Dropdown" },
    ];

    return (
      <div className={styles.container}>
        <h2 className={styles.heading}>Dynamic Forms Builder</h2>

        {/* Add Field Section */}
        <div className={styles.addFieldSection}>
          <TextField
            label="Field Label"
            value={newFieldLabel}
            onChange={(e, value) => this.setState({ newFieldLabel: value || "" })}
            required
          />
          <Dropdown
            label="Field Type"
            options={fieldTypeOptions}
            selectedKey={newFieldType}
            onChange={(e, option) => this.setState({ newFieldType: option?.key as string })}
            required
          />
          {newFieldType === "Dropdown" && (
            <TextField
              label="Dropdown Options (comma separated)"
              value={newDropdownOptions}
              onChange={(e, value) => this.setState({ newDropdownOptions: value || "" })}
            />
          )}
          <DefaultButton text="Add Field" onClick={this.handleAddField} className={styles.addButton} />
        </div>

        {/* Form Preview Section */}
        <div className={styles.formPreviewSection}>
          <h3 className={styles.previewHeading}>Form Preview</h3>
          {fields.length === 0 ? (
            <p className={styles.noFieldsMessage}>No fields added yet.</p>
          ) : (
            <div className={styles.fieldsContainer}>
              {fields.map((field) => (
                <div key={field.id} className={styles.fieldWrapper}>
                  {this.renderFieldInput(field)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save to SharePoint */}
        <DefaultButton
          text="Save Form Data to SharePoint"
          onClick={this.handleSaveToSharePoint}
          className={styles.saveButton}
        />
      </div>
    );
  }
}