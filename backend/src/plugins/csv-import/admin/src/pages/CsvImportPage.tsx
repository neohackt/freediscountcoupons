import { useState } from 'react';
import { Page, Layouts, useFetchClient, useNotification } from '@strapi/strapi/admin';
import {
  Alert,
  Box,
  Button,
  Flex,
  SingleSelect,
  SingleSelectOption,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Typography,
} from '@strapi/design-system';

type ImportType = 'coupons' | 'stores' | 'categories';

interface ImportRowError {
  row: number;
  field: string;
  message: string;
  value?: unknown;
}

interface ImportResult {
  filename?: string | null;
  format?: string;
  type?: string;
  status?: string;
  total_rows?: number;
  imported_count?: number;
  skipped_count?: number;
  error_count?: number;
  errors?: ImportRowError[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const CsvImportPage = () => {
  const { post } = useFetchClient();
  const { toggleNotification } = useNotification();

  const [importType, setImportType] = useState<ImportType>('coupons');
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [transportError, setTransportError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setResult(null);
    setTransportError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!selected.name.toLowerCase().endsWith('.csv')) {
      toggleNotification({
        type: 'warning',
        message: 'Please select a .csv file.',
      });
      setFile(null);
      setFileInputKey((key) => key + 1);
      return;
    }
    setFile(selected);
  };

  const handleImport = async () => {
    if (!file || isLoading) return;
    setIsLoading(true);
    setResult(null);
    setTransportError(null);

    try {
      const formData = new FormData();
      formData.append('type', importType);
      formData.append('file', file, file.name);

      const { data } = await post('/csv-import/upload', formData);
      const job = (data?.data ?? {}) as ImportResult;
      setResult(job);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'The import request failed. Please try again.';
      setTransportError(message);
      toggleNotification({ type: 'danger', message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setTransportError(null);
    setFileInputKey((key) => key + 1);
  };

  const rowErrors = result?.errors ?? [];
  const failed = result?.error_count ?? 0;

  return (
    <Page.Main>
      <Layouts.Header
        title="CSV Import"
        subtitle="Upload a CSV file from your computer to import coupons, stores or categories."
      />
      <Layouts.Content>
        <Box background="neutral0" padding={6} shadow="tableShadow" hasRadius>
          <Flex direction="column" alignItems="stretch" gap={4}>
            <Box>
              <Typography variant="sigma" textColor="neutral600">
                IMPORT TYPE
              </Typography>
              <Box paddingTop={1}>
                <SingleSelect
                  value={importType}
                  disabled={isLoading}
                  onChange={(value: string | number) => {
                    setImportType(value as ImportType);
                    setResult(null);
                    setTransportError(null);
                  }}
                  aria-label="Import type"
                >
                  <SingleSelectOption value="coupons">Coupons</SingleSelectOption>
                  <SingleSelectOption value="stores">Stores</SingleSelectOption>
                  <SingleSelectOption value="categories">Categories</SingleSelectOption>
                </SingleSelect>
              </Box>
            </Box>

            <Box>
              <Typography variant="sigma" textColor="neutral600">
                CSV FILE
              </Typography>
              <Box paddingTop={1}>
                <input
                  key={fileInputKey}
                  type="file"
                  accept=".csv,text/csv"
                  disabled={isLoading}
                  onChange={handleFileChange}
                  aria-label="CSV file"
                />
              </Box>
              {file && (
                <Box paddingTop={2}>
                  <Typography variant="pi" textColor="neutral700">
                    {file.name} · {formatFileSize(file.size)}
                  </Typography>
                </Box>
              )}
            </Box>

            <Flex gap={2}>
              <Button onClick={handleImport} loading={isLoading} disabled={!file || isLoading}>
                {isLoading ? 'Importing…' : 'Import'}
              </Button>
              {(result || transportError) && !isLoading && (
                <Button variant="tertiary" onClick={handleReset}>
                  Import another file
                </Button>
              )}
            </Flex>

            {transportError && (
              <Alert closeLabel="Close" onClose={() => setTransportError(null)} variant="danger">
                Import request failed: {transportError}. No import was started — check your
                connection and try again.
              </Alert>
            )}

            {result && (
              <Flex direction="column" alignItems="stretch" gap={4}>
                <Alert
                  closeLabel="Close"
                  variant={failed > 0 ? 'warning' : 'success'}
                  title={
                    failed > 0
                      ? 'Import completed with row errors'
                      : 'Import completed successfully'
                  }
                >
                  Total rows: {result.total_rows ?? 0} · Imported: {result.imported_count ?? 0} ·
                  Skipped: {result.skipped_count ?? 0} · Failed: {failed}
                </Alert>

                {rowErrors.length > 0 && (
                  <Box>
                    <Box paddingBottom={2}>
                      <Typography variant="delta">Row-level errors</Typography>
                    </Box>
                    <Table colCount={3} rowCount={rowErrors.length}>
                      <Thead>
                        <Tr>
                          <Th>
                            <Typography variant="sigma">Row</Typography>
                          </Th>
                          <Th>
                            <Typography variant="sigma">Field</Typography>
                          </Th>
                          <Th>
                            <Typography variant="sigma">Message</Typography>
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {rowErrors.map((rowError, index) => (
                          <Tr key={`${rowError.row}-${rowError.field}-${index}`}>
                            <Td>
                              <Typography>{rowError.row}</Typography>
                            </Td>
                            <Td>
                              <Typography>{rowError.field}</Typography>
                            </Td>
                            <Td>
                              <Typography>{rowError.message}</Typography>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </Flex>
            )}
          </Flex>
        </Box>
      </Layouts.Content>
    </Page.Main>
  );
};

export { CsvImportPage };
