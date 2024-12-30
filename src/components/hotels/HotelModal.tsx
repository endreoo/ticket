import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Row, Col, Divider, Table, Button, Tag, message, Tabs } from 'antd';
import type { Hotel, HotelContact } from '../../types/database';
import { BuildingOffice2Icon, MapPinIcon, GlobeAltIcon, DocumentTextIcon, BuildingStorefrontIcon, UserGroupIcon, DocumentCheckIcon, ArrowPathIcon, GlobeAmericasIcon, UserIcon, PlusIcon } from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import ContactModal from './ContactModal';

interface HotelModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: Partial<Hotel>) => Promise<void>;
  initialValues?: Hotel;
  title: string;
}

const HotelModal: React.FC<HotelModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  initialValues,
  title
}) => {
  const [form] = Form.useForm();
  const [contacts, setContacts] = useState<HotelContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [selectedContact, setSelectedContact] = useState<HotelContact | undefined>();

  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [visible, initialValues, form]);

  useEffect(() => {
    if (visible && initialValues?.id) {
      fetchContacts(initialValues.id);
    }
  }, [visible, initialValues]);

  const fetchContacts = async (hotelId: number) => {
    try {
      setLoadingContacts(true);
      const response = await api.hotels.getContacts(hotelId);
      setContacts(response);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const contactColumns = [
    {
      title: 'Name',
      key: 'name',
      render: (record: HotelContact) => `${record.first_name} ${record.last_name}`
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position'
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: HotelContact) => (
        record.is_primary ? <Tag color="blue">Primary Contact</Tag> : null
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: HotelContact) => (
        <div className="space-x-2">
          <Button type="link" onClick={() => handleEditContact(record)}>
            Edit
          </Button>
          <Button type="link" danger onClick={() => handleRemoveContact(record)}>
            Remove
          </Button>
        </div>
      )
    }
  ];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const IconWrapper = ({ icon: Icon, children }: { icon: React.ElementType, children: React.ReactNode }) => (
    <div className="flex items-center gap-2 text-gray-600 mb-1">
      <Icon className="h-4 w-4" />
      {children}
    </div>
  );

  const handleEditContact = async (contact: HotelContact) => {
    setSelectedContact(contact);
    setShowAddContact(true);
  };

  const handleRemoveContact = async (contact: HotelContact) => {
    try {
      if (!initialValues?.id) return;
      await api.hotels.removeContact(initialValues.id, contact.id);
      message.success('Contact removed successfully');
      fetchContacts(initialValues.id);
    } catch (error) {
      console.error('Error removing contact:', error);
      message.error('Failed to remove contact');
    }
  };

  const handleContactSubmit = async (values: Omit<HotelContact, 'id'>) => {
    try {
      if (!initialValues?.id) return;

      if (selectedContact) {
        await api.hotels.updateContact(initialValues.id, selectedContact.id, values);
        message.success('Contact updated successfully');
      } else {
        await api.hotels.addContact(initialValues.id, values);
        message.success('Contact added successfully');
      }
      setShowAddContact(false);
      setSelectedContact(undefined);
      fetchContacts(initialValues.id);
    } catch (error) {
      console.error('Error saving contact:', error);
      message.error('Failed to save contact');
    }
  };

  const renderHotelInfo = () => (
    <div className="py-4">
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="name"
            label={<IconWrapper icon={BuildingOffice2Icon}>Hotel Name</IconWrapper>}
            rules={[{ required: true, message: 'Please enter the hotel name' }]}
          >
            <Input placeholder="Enter hotel name" className="rounded-md" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="location"
            label={<IconWrapper icon={MapPinIcon}>Location</IconWrapper>}
            rules={[{ required: true, message: 'Please enter the hotel location' }]}
          >
            <Input placeholder="Enter location" className="rounded-md" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="sub_location"
            label={<IconWrapper icon={MapPinIcon}>Sub Location</IconWrapper>}
          >
            <Input placeholder="Enter sub location" className="rounded-md" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="url"
            label={<IconWrapper icon={GlobeAltIcon}>Website URL</IconWrapper>}
          >
            <Input placeholder="Enter website URL" className="rounded-md" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="description"
        label={<IconWrapper icon={DocumentTextIcon}>Description</IconWrapper>}
      >
        <Input.TextArea 
          rows={4} 
          placeholder="Enter hotel description"
          className="rounded-md"
        />
      </Form.Item>

      <Divider className="my-4">Business Information</Divider>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="market"
            label={<IconWrapper icon={BuildingStorefrontIcon}>Market</IconWrapper>}
          >
            <Input placeholder="Enter market" className="rounded-md" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="segment"
            label={<IconWrapper icon={UserGroupIcon}>Segment</IconWrapper>}
          >
            <Input placeholder="Enter segment" className="rounded-md" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="agreement"
            label={<IconWrapper icon={DocumentCheckIcon}>Agreement</IconWrapper>}
          >
            <Input placeholder="Enter agreement" className="rounded-md" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="sales_process"
            label={<IconWrapper icon={ArrowPathIcon}>Sales Process</IconWrapper>}
          >
            <Select className="rounded-md">
              <Select.Option value="new">New</Select.Option>
              <Select.Option value="in_progress">In Progress</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="Bcom_status"
            label={<IconWrapper icon={GlobeAmericasIcon}>Booking.com Status</IconWrapper>}
          >
            <Select className="rounded-md">
              <Select.Option value="live">Live</Select.Option>
              <Select.Option value="not_live">Not Live</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </div>
  );

  const renderContacts = () => (
    <div className="py-4">
      {initialValues?.id ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button 
              type="primary" 
              icon={<PlusIcon className="h-4 w-4" />} 
              onClick={() => setShowAddContact(true)}
            >
              Add Contact
            </Button>
          </div>
          <Table
            columns={contactColumns}
            dataSource={contacts}
            rowKey="id"
            loading={loadingContacts}
            pagination={false}
            className="contacts-table"
            size="small"
          />
        </div>
      ) : (
        <div className="text-gray-500 text-center py-4">
          Contacts can be added after creating the hotel
        </div>
      )}
    </div>
  );

  const items = [
    {
      key: 'info',
      label: (
        <div className="flex items-center gap-2">
          <BuildingOffice2Icon className="h-4 w-4" />
          <span>Hotel Information</span>
        </div>
      ),
      children: renderHotelInfo(),
    },
    {
      key: 'contacts',
      label: (
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <span>Contacts</span>
        </div>
      ),
      children: renderContacts(),
    }
  ];

  return (
    <>
      <Modal
        title={
          <div className="flex items-center gap-2 text-lg">
            <BuildingOffice2Icon className="h-5 w-5 text-blue-500" />
            <span>{title}</span>
          </div>
        }
        open={visible}
        onCancel={() => {
          form.resetFields();
          onCancel();
        }}
        onOk={handleSubmit}
        okText={initialValues ? 'Update Hotel' : 'Create Hotel'}
        width={800}
        className="hotel-modal"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
          className="mt-4"
        >
          <Tabs items={items} />
        </Form>
      </Modal>

      <ContactModal
        visible={showAddContact}
        onCancel={() => {
          setShowAddContact(false);
          setSelectedContact(undefined);
        }}
        onSubmit={handleContactSubmit}
        initialValues={selectedContact}
        title={selectedContact ? 'Edit Contact' : 'Add Contact'}
      />
    </>
  );
};

export default HotelModal; 