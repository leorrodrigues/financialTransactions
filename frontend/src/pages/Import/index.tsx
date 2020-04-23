import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { size } from 'polished';
import Header from '../../components/Header';
import FileList from '../../components/FileList';
import Upload from '../../components/Upload';

import { Container, Title, ImportFileContainer, Footer } from './styles';

import alert from '../../assets/alert.svg';
import api from '../../services/api';

interface FileProps {
    file: File;
    name: string;
    readableSize: string;
}

const Import: React.FC = () => {
    const [uploadedFiles, setUploadedFiles] = useState<FileProps[]>([]);
    const history = useHistory();

    async function handleUpload(): Promise<void> {
        const data = new FormData();

        // eslint-disable-next-line array-callback-return
        uploadedFiles.map((file) => {
            data.append('file', file.file, file.name);
        });

        try {
            await api.post('/transactions/import', data);

            history.push('/');
        } catch (err) {
            console.log(err.response.error);
        }
    }

    function submitFile(files: File[]): void {
        const filesData = files.map((file) => ({
            file,
            name: file.name,
            readableSize: String(size),
        }));
        const allFiles = uploadedFiles.concat(filesData);
        setUploadedFiles(allFiles);
    }

    return (
        <>
            <Header size="small" />
            <Container>
                <Title>Import a transaction</Title>
                <ImportFileContainer>
                    <Upload onUpload={submitFile} />
                    {!!uploadedFiles.length && (
                        <FileList files={uploadedFiles} />
                    )}

                    <Footer>
                        <p>
                            <img src={alert} alt="Alert" />
                            Only CSV allowed
                        </p>
                        <button onClick={handleUpload} type="button">
                            Send
                        </button>
                    </Footer>
                </ImportFileContainer>
            </Container>
        </>
    );
};

export default Import;
