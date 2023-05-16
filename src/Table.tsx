import React, { useState } from "react";
import './App.css';

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  defaultSortColumn?: string;
  defaultSortDirection?: "asc" | "desc";
  pageSize?: number;
  size?: "small" | 'middle' | 'large';
  scroll?: {
    x?: number;
    y?: number;
  };
}

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  fixed?: "left" | "right";
  width?: number;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface SortState {
  columnKey: string;
  direction: "asc" | "desc";
}

function Table<T>(props: TableProps<T>): React.ReactElement {
  const {
    data,
    columns,
    defaultSortColumn,
    defaultSortDirection,
    pageSize = 10,
    scroll,
    size = 'middle'
  } = props;

  const [currentPage, setCurrentPage] = useState(1);
  const [sortState, setSortState] = useState<SortState>({
    columnKey: defaultSortColumn || "",
    direction: defaultSortDirection || "asc",
  });

  let sizeClassName;
  switch (size) {
    case 'small':
      sizeClassName = 'table-small'
      break;
    case 'middle':
      sizeClassName = 'table-middle'
      break;
    case 'large':
      sizeClassName = 'table-large'
      break;
    default:
      break;
  }

  const totalPages = pageSize ? Math.ceil(data.length / pageSize) : 1;

  const sortedData = [...data].sort((a, b) => {
    const { columnKey, direction } = sortState;
    if (!columnKey) return 0;

    //@ts-ignore
    const aValue = a[columnKey];
    //@ts-ignore
    const bValue = b[columnKey];

    if (aValue === bValue) return 0;

    const sortOrder = direction === "asc" ? 1 : -1;

    return sortOrder * (aValue < bValue ? -1 : 1);
  });

  const startRowIndex = pageSize ? (currentPage - 1) * pageSize : 0;
  const endRowIndex = pageSize ? startRowIndex + pageSize : data.length;

  const visibleData = sortedData.slice(startRowIndex, endRowIndex);

  const fixedLeftColumns = columns.filter((column) => column.fixed === "left");
  const fixedRightColumns = columns.filter((column) => column.fixed === "right").reverse();
  const nofixedColumns = columns.filter(column => !fixedLeftColumns.includes(column) && !fixedRightColumns.includes(column));

  const HeaderColumns = ({
    columns,
    fixType,
    style
  }: {
    columns: TableColumn<T>[],
    fixType?: 'left' | 'nofix' | 'right',
    style?: React.CSSProperties
  }) => {
    if (columns.length <= 0) return null
    return (
      <>
        {columns.map((column, index) => {
          return (
            <th
              key={column.key as string}
              style={{
                width: column?.width,
                position: "sticky",
                zIndex: 99,
                background: '#e92',
                left: fixType === 'left' ? column.width && column.width * index : undefined,
                right: fixType === 'right' ? column.width && column.width * index : undefined,
                ...style
              }}
            >
              {column.title}
              {column.sortable && (
                <button
                  style={{ marginLeft: "8px" }}
                  onClick={() => {
                    setSortState({
                      columnKey: column.key as string,
                      direction: sortState.direction === "asc" ? "desc" : "asc",
                    });
                    setCurrentPage(1);
                  }}
                >
                  {sortState.columnKey === column.key &&
                    (sortState.direction === "asc" ? "↑" : "↓")}
                </button>
              )}
            </th>
          )
        })}
      </>
    )
  }

  const tableHeader = (
    <thead style={{ position: "sticky", top: 0, zIndex: 110, background: '#fff' }}>
      <tr>
        <HeaderColumns
          columns={fixedLeftColumns}
          fixType={'left'}
        />
        <HeaderColumns
          columns={nofixedColumns}
          fixType={'nofix'}
          style={{
            zIndex: 1,
            background: undefined
          }}
        />
        <HeaderColumns
          columns={fixedRightColumns}
          fixType={'right'}
        />
      </tr>
    </thead>
  )

  const Column = ({
    key,
    column,
    row,
    style
  }: {
    key: string,
    column: TableColumn<T>,
    row: T,
    style: React.CSSProperties
  }) => (
    <td
      key={key}
      style={{
        textAlign: 'center',
        position: 'sticky',
        ...style
      }}
    >
      {column.render ? column.render(row[column.key], row) : row[column.key] as any}
    </td>
  )

  const BodyColumns = ({
    row,
    rowIndex,
    columns,
    fixType,
    style
  }: {
    rowIndex: number,
    row: T,
    columns: TableColumn<T>[],
    fixType?: 'left' | 'nofix' | 'right',
    style?: React.CSSProperties
  }) => {
    if (columns.length <= 0) return null;
    return (
      <>
        {
          columns.map((column, columnIndex) => (
            <Column
              key={`${rowIndex}_${columnIndex}`}
              row={row}
              column={column}
              style={{
                zIndex: 33,
                background: '#e92',
                left: fixType === 'left' ? column.width && column.width * columnIndex : undefined,
                right: fixType === 'right' ? column.width && column.width * columnIndex : undefined,
                ...style
              }}
            />
          ))
        }
      </>
    )
  }

  const tableBody = (
    <tbody>
      {visibleData.map((row, rowIndex) => (
        <tr key={rowIndex}>
          <BodyColumns
            row={row}
            rowIndex={rowIndex}
            columns={fixedLeftColumns}
            fixType="left"
          />
          <BodyColumns
            row={row}
            rowIndex={rowIndex}
            columns={nofixedColumns}
            fixType="nofix"
            style={{
              background: undefined,
              zIndex: 1
            }}
          />
          <BodyColumns
            row={row}
            rowIndex={rowIndex}
            columns={fixedRightColumns}
            fixType="right"
          />
        </tr>
      ))}
    </tbody>
  )

  const pagination = (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        marginTop: "1rem",
      }}
    >
      <span style={{ marginRight: "1rem" }}>
        Page {currentPage} of {totalPages}
      </span>
      {Array.from(Array(totalPages).keys()).map((pageNumber) => (
        <button
          key={pageNumber}
          onClick={() => setCurrentPage(pageNumber + 1)}
          style={{
            border: "none",
            backgroundColor: currentPage === pageNumber + 1 ? "#ccc" : "#fff",
            cursor: currentPage === pageNumber + 1 ? "default" : "pointer",
            marginLeft: "0.5rem",
            padding: size === 'small' ? "0.25rem 0.5rem" : "0.5rem 0.75rem",
          }}
        >
          {pageNumber + 1}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <div className={`table-wrapper ${sizeClassName}`} style={{ height: scroll?.y }}>
        <table style={{ minWidth: '100%', width: scroll?.x }}>
          {tableHeader}
          {tableBody}
        </table>
      </div>
      {totalPages > 1 && pagination}
    </>
  );
}

export default Table;
