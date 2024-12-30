import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { Hotel } from '../types/database';
import { useDebounce } from '../hooks/useDebounce';
import { Button, Input, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TablePaginationConfig } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import HotelModal from '../components/hotels/HotelModal';

export function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | undefined>();
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const debouncedSearch = useDebounce(searchTerm, 500);

  const fetchHotels = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.hotels.list({
        page: pagination.current || 1,
        limit: pagination.pageSize || 10,
        search: debouncedSearch
      });
      setHotels(response.hotels || []);
      setPagination((prev: TablePaginationConfig) => ({
        ...prev,
        total: response.pagination.total
      }));
    } catch (error) {
      console.error('Error fetching hotels:', error);
      message.error('Failed to fetch hotels');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, debouncedSearch]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination((prev: TablePaginationConfig) => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    }));
  };

  const columns: ColumnsType<Hotel> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Hotel, b: Hotel) => a.name.localeCompare(b.name),
      render: (_: string, record: Hotel) => (
        <a onClick={() => handleEdit(record)} className="text-blue-600 hover:text-blue-800 cursor-pointer">
          {record.name}
        </a>
      )
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      sorter: (a: Hotel, b: Hotel) => a.location.localeCompare(b.location)
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Hotel) => (
        <div className="space-x-2">
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </div>
      )
    }
  ];

  const handleEdit = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setModalVisible(true);
  };

  const handleDelete = async (hotel: Hotel) => {
    try {
      await api.hotels.delete(hotel.id.toString());
      message.success('Hotel deleted successfully');
      fetchHotels();
    } catch (error) {
      console.error('Error deleting hotel:', error);
      message.error('Failed to delete hotel');
    }
  };

  const handleCreate = () => {
    setSelectedHotel(undefined);
    setModalVisible(true);
  };

  const handleModalSubmit = async (values: Partial<Hotel>) => {
    try {
      if (selectedHotel) {
        await api.hotels.update(selectedHotel.id.toString(), values);
        message.success('Hotel updated successfully');
      } else {
        await api.hotels.create(values as Omit<Hotel, 'id' | 'created_at' | 'updated_at'>);
        message.success('Hotel created successfully');
      }
      setModalVisible(false);
      fetchHotels();
    } catch (error) {
      console.error('Error saving hotel:', error);
      message.error('Failed to save hotel');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hotels</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add Hotel
        </Button>
      </div>

      <div className="mb-4">
        <Input.Search
          placeholder="Search hotels..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={hotels}
        rowKey="id"
        pagination={pagination}
        onChange={handleTableChange}
        loading={loading}
      />

      <HotelModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleModalSubmit}
        initialValues={selectedHotel}
        title={selectedHotel ? 'Edit Hotel' : 'Create Hotel'}
      />
    </div>
  );
}