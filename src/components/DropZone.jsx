import React from 'react';
import { UploadCloud } from 'lucide-react';
import styles from './DropZone.module.css';

const DropZone = ({ onFileLoaded }) => {
    const handleFile = (file) => {
        if (file && file.type === 'text/csv' || file.name.endsWith('.csv')) {
            onFileLoaded(file);
        } else {
            alert('Please upload a valid CSV file');
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const onChange = (e) => {
        const file = e.target.files[0];
        handleFile(file);
    };

    return (
        <div
            className={styles.dropZone}
            onDrop={onDrop}
            onDragOver={onDragOver}
        >
            <input
                type="file"
                id="fileInput"
                accept=".csv"
                onChange={onChange}
                style={{ display: 'none' }}
            />
            <label htmlFor="fileInput" className={styles.label}>
                <UploadCloud size={48} className={styles.icon} />
                <h3>Upload Check Register CSV</h3>
                <p>Drag & drop or click to browse</p>
            </label>
        </div>
    );
};

export default DropZone;
