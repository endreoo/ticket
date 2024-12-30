import React, { useEffect } from 'react';
import { Modal, Form, Input, Switch, Tabs, Table, Button, Tag } from 'antd';
import type { HotelContact, Hotel } from '../../types/database';
import { UserIcon, BuildingOffice2Icon, PhoneIcon, EnvelopeIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

interface ContactModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: Omit<HotelContact, 'id'>) => Promise<void>;
  initialValues?: HotelContact;
  title: string;
  hotels?: Hotel[];
}

const ContactModal: React.FC<ContactModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  initialValues,
  title,
  hotels = []
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [visible, initialValues, form]);

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

  const renderContactInfo = () => (
    <div className="py-4">
      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          name="first_name"
          label={<IconWrapper icon={UserIcon}>First Name</IconWrapper>}
          rules={[{ required: true, message: 'Please enter first name' }]}
        >
          <Input placeholder="Enter first name" />
        </Form.Item>

        <Form.Item
          name="last_name"
          label={<IconWrapper icon={UserIcon}>Last Name</IconWrapper>}
          rules={[{ required: true, message: 'Please enter last name' }]}
        >
          <Input placeholder="Enter last name" />
        </Form.Item>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          name="email"
          label={<IconWrapper icon={EnvelopeIcon}>Email</IconWrapper>}
          rules={[
            { required: true, message: 'Please enter email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input placeholder="Enter email address" />
        </Form.Item>

        <Form.Item
          name="phone"
          label={<IconWrapper icon={PhoneIcon}>Phone</IconWrapper>}
        >
          <Input placeholder="Enter phone number" />
        </Form.Item>
      </div>

      <Form.Item
        name="position"
        label={<IconWrapper icon={BriefcaseIcon}>Position</IconWrapper>}
      >
        <Input placeholder="Enter position" />
      </Form.Item>

      <Form.Item
        name="role"
        label={<IconWrapper icon={BriefcaseIcon}>Role</IconWrapper>}
        rules={[{ required: true, message: 'Please enter role' }]}
      >
        <Input placeholder="Enter role" />
      </Form.Item>

      <Form.Item
        name="is_primary"
        label={<IconWrapper icon={UserIcon}>Primary Contact</IconWrapper>}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
    </div>
  );

  const renderHotels = () => (
    <div className="py-4">
      <Table
        columns={[
          {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
          },
          {
            title: 'Hotel Name',
            dataIndex: 'name',
            key: 'name',
          },
          {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
          },
          {
            title: 'Status',
            key: 'status',
            render: () => <Tag color="blue">Active</Tag>
          }
        ]}
        dataSource={hotels}
        rowKey="id"
        pagination={false}
      />
    </div>
  );

  const items = [
    {
      key: 'info',
      label: (
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <span>Contact Information</span>
        </div>
      ),
      children: renderContactInfo(),
    },
    {
      key: 'hotels',
      label: (
        <div className="flex items-center gap-2">
          <BuildingOffice2Icon className="h-4 w-4" />
          <span>Hotels</span>
        </div>
      ),
      children: renderHotels(),
    }
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-lg">
          <UserIcon className="h-5 w-5 text-blue-500" />
          <span>{title}</span>
        </div>
      }
      open={visible}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={handleSubmit}
      okText={initialValues ? 'Update Contact' : 'Add Contact'}
      width={800}
      className="contact-modal"
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
  );
};

export default ContactModal; 