import React, { useEffect, useState } from 'react';
import { getService, postService, putService, deleteService } from '../../../../constants/Service';
import apiName from '../../../../constants/ApiName';
import Loader from '../../../../components/Loader';
import { Modal } from '../../../../components/ui/modal';
import Button from '../../../../components/ui/button/Button';
import Input from '../../../../components/form/input/InputField';
import Label from '../../../../components/form/Label';
import { showToast } from '../../../../components/Toast';
import { Link } from 'react-router-dom';
import { FaCheck, FaEdit, FaTrash } from 'react-icons/fa';
import { IoMdClose } from "react-icons/io";
const SubscriptionPlans = () => {
    const [subscriptionsList, setSubscriptionsList] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState('');
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false); // Delete confirmation modal
    const [subscriptionToDelete, setSubscriptionToDelete] = useState(null); // Track subscription to delete
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        validityInDays: '',
        description: '',
        color: '',
        recurence: '',
        isVisible: true,
        limits: {
            userLimit: '',
            departmentLimit: '',
            medicineLimit: '',
            saleLimitPerDay: ''
        },
        features: []
    });
    const [ErrorMessage, setErrorMessage] = useState('')
    useEffect(() => {
        setLoading(true);
        getSubscriptionsList();
    }, []);

    const getSubscriptionsList = async () => {
        try {
            const result = await getService(apiName.SuperSubscriptionPlan); // API endpoint (e.g. '/posts')
            setEditMode(false);
            setEditId('');
            setSubscriptionsList(result?.data.data);
            setShowModal(false);
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    };

    const handleEdit = (subscriptionData) => {
        setErrorMessage('')
        setShowModal(true);
        setEditMode(true);
        setEditId(subscriptionData._id);
        setFormData({
            name: subscriptionData?.name,
            price: subscriptionData?.price,
            validityInDays: subscriptionData?.validityInDays,
            description: subscriptionData?.description,
            color: subscriptionData?.color,
            recurence: subscriptionData?.recurence,
            isVisible: subscriptionData?.isVisible,
            limits: {
                userLimit: subscriptionData?.limits?.userLimit,
                departmentLimit: subscriptionData?.limits?.departmentLimit,
                medicineLimit: subscriptionData?.limits?.medicineLimit,
                saleLimitPerDay: subscriptionData?.limits?.saleLimitPerDay
            },
            features: subscriptionData?.features
        })
    };

    const handleDelete = (subscriptionId) => {
        setSubscriptionToDelete(subscriptionId); // Store subscription ID for deletion
        setShowDeleteModal(true);  // Show confirmation modal
    };

    const handleAddSubscription = async (e) => {
        e.preventDefault();

        // Required fields to validate
        const requiredFields = ['name', 'price', 'validityInDays', 'description', 'color', 'recurence'];
        const limitsFields = ['userLimit', 'departmentLimit', 'medicineLimit', 'saleLimitPerDay'];

        let error = '';

        // Validate top-level fields
        for (const field of requiredFields) {
            if (!formData?.[field]) {
                error = `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`;
                break;
            }
        }

        // Validate limits
        if (!error) {
            for (const field of limitsFields) {
                if (!formData?.limits?.[field] && formData?.limits?.[field] !== 0) {
                    error = `${field.replace(/([A-Z])/g, ' $1')} is required.`;
                    break;
                }
            }
        }

        // Validate features
        if (!error && (!formData?.features || formData.features.length === 0)) {
            error = 'At least one feature is required.';
        } else if (!error) {
            for (let i = 0; i < formData.features.length; i++) {
                const feature = formData.features[i];
                if (!feature.key || !feature.label || !feature.description) {
                    error = `All fields for feature #${i + 1} are required.`;
                    break;
                }
            }
        }

        if (error) {
            setErrorMessage(error);
            return;
        }

        const body = {
            name: formData.name,
            price: Number(formData.price),
            validityInDays: Number(formData.validityInDays),
            description: formData.description,
            color: formData.color,
            recurence: formData.recurence,
            features: formData.features.map(f => ({
                ...f,
                isEnabled: f.isEnabled === 'true' || f.isEnabled === true
            })),
            limits: {
                userLimit: Number(formData.limits.userLimit),
                departmentLimit: Number(formData.limits.departmentLimit),
                medicineLimit: Number(formData.limits.medicineLimit),
                saleLimitPerDay: Number(formData.limits.saleLimitPerDay)
            },
            isVisible: formData.isVisible === 'true' || formData.isVisible === true
        };

        try {
            if (editMode) {
                await putService(`${apiName.SuperSubscriptionPlan}/${editId}`, body);
                showToast("Subscription updated successfully.", 'success');
            } else {
                await postService(apiName.SuperSubscriptionPlan, body);
                showToast("Subscription added successfully.", 'success');
            }
            getSubscriptionsList();
        } catch (error) {
            console.error('Error saving subscription:', error);
            showToast('Something went wrong.', 'error');
        }
    };


    const handleConfirmDelete = async () => {
        try {
            // Call delete service with the subscription ID
            await deleteService(`${apiName.SuperSubscriptionPlan}/${subscriptionToDelete}`);
            showToast('Subscription deleted successfully', 'success');
            getSubscriptionsList(); // Refresh the subscription list
        } catch (error) {
            showToast('Error deleting subscription', 'error');
        }
        setShowDeleteModal(false); // Close the confirmation modal
        setSubscriptionToDelete(null);    // Clear the subscription ID
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('limits.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...(prev?.[parent] || {}), [child]: Number(value) }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'isVisible' ? (value === 'true') : value
            }));
        }
    };


    const handleFeatureChange = (e, index, field) => {
        e.preventDefault();
        const { value } = e.target;

        setFormData(prev => {
            const features = [...(prev.features || [])];

            // Ensure the feature object exists
            if (!features[index]) {
                features[index] = { key: '', label: '', description: '', isEnabled: true };
            }

            features[index][field] = field === 'isEnabled' ? (value === 'true') : value;

            return { ...prev, features };
        });
    };


    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
            {/* Add Subscription Button */}
            <div className="w-full p-4 flex justify-between items-center">
                <div className="text-3xl font-medium text-gray-800 dark:text-white">Subscriptions List</div>
                <Button
                    onClick={() => {
                        setShowModal(true);
                        setErrorMessage('');
                        setEditMode(false);
                        setEditId();
                        setFormData({
                            name: '',
                            price: '',
                            validityInDays: '',
                            description: '',
                            color: '',
                            recurence: '',
                            isVisible: true,
                            limits: {
                                userLimit: '',
                                departmentLimit: '',
                                medicineLimit: '',
                                saleLimitPerDay: ''
                            },
                            features: []
                        })
                    }}
                >
                    <Link>Add Subscription</Link>
                </Button>
            </div>

            {loading ? (
                <Loader />
            ) : (
                <div className="overflow-x-auto bg-white shadow-md rounded-lg dark:bg-gray-900 dark:border-gray-700">
                    {subscriptionsList.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-300 mt-10">No subscriptions found</p>
                    ) : (
                        <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-3 sm:grid-cols-1">
                            {subscriptionsList.map((plan, index) => {
                                const isCurrent = '';
                                const isUpgrade = index > -1 && index > index;
                                const isDowngrade = index > -1 && index < index;

                                return (
                                    <div
                                        key={plan.name}
                                        className={`relative rounded-2xl shadow-lg overflow-hidden border
                ${plan.mostPopular ? 'border-blue-600 ring-2 ring-blue-500' : 'border-gray-200'}
                ${isCurrent ? 'border-green-500 ring-green-400' : ''}
                 bg-white dark:bg-gray-700 dark:border-gray-600`}
                                    >
                                        {plan.mostPopular && !isCurrent && (
                                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-bl-lg">
                                                Most Popular
                                            </div>
                                        )}
                                        {isCurrent && (
                                            <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-semibold px-4 py-1 rounded-bl-lg">
                                                Current Plan
                                            </div>
                                        )}

                                        <div className="p-8">
                                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{plan.name}</h3>
                                            <p className="mt-2 text-gray-500 dark:text-gray-300">{plan.description}</p>
                                            <div className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">₹ {plan.price}/<span className='text-2xl'>Student</span> </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{plan.validityInDays} days • {plan.recurence}</p>

                                            <ul className="mt-6 space-y-3">
                                                {console.log('plan.featuresplan.features', plan.features)}
                                                {plan.features.map((feature, index) => (
                                                    <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                                                        {feature?.isEnabled ? <FaCheck className="text-green-500 mr-2" /> : <IoMdClose className="text-red-500 mr-2 text-xl" />}
                                                        {feature.label}
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="mt-6 flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(plan)}
                                                    disabled={isCurrent || isDowngrade}
                                                    className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
                                                    title="Edit Plan"
                                                >
                                                    <FaEdit size={16} />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(plan._id)}
                                                    disabled={isCurrent}
                                                    className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm disabled:opacity-50"
                                                    title="Delete Plan"
                                                >
                                                    <FaTrash size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Subscription Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setErrorMessage('');
                }}
                className="max-w-[700px] m-4"
            >
                <div className="relative w-full max-w-[700px] overflow-hidden rounded-3xl bg-white dark:bg-gray-900 p-4 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            {editMode ? 'Update Subscription' : 'Add Subscription'}
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            {editMode ? 'Update the subscription details below.' : 'Add a new subscription here.'}
                        </p>
                    </div>

                    <form className="flex flex-col">
                        {/* Scrollable section starts here */}
                        <div className="custom-scrollbar overflow-y-auto px-2 pb-3" style={{ maxHeight: '60vh' }}>
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                                {[
                                    { label: 'Name', name: 'name' },
                                    { label: 'Price', name: 'price' },
                                    { label: 'Validity Days', name: 'validityInDays' },
                                    { label: 'Description', name: 'description' },
                                    { label: 'Color', name: 'color', type: 'color' },
                                    { label: 'Recurence', name: 'recurence', },
                                ].map(({ label, name, type = 'text' }) => (
                                    <div key={name}>
                                        <Label className="text-gray-600">{label}:</Label>
                                        <Input
                                            type={type}
                                            name={name}
                                            value={formData?.[name] || ''}
                                            onChange={handleInputChange}
                                            className="w-full mt-2 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                    </div>
                                ))}

                                {/* Visibility Toggle */}
                                <div>
                                    <Label className="text-gray-600">Is Visible:</Label>
                                    <select
                                        name="isVisible"
                                        value={formData?.isVisible ?? true}
                                        onChange={handleInputChange}
                                        className="w-full mt-2 p-3 border border-gray-300 rounded-xl"
                                    >
                                        <option value={true}>Yes</option>
                                        <option value={false}>No</option>
                                    </select>
                                </div>
                            </div>

                            {/* Limits Section */}
                            <h4 className="mt-6 mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Limits</h4>
                            <div key="limits.userLimit">
                                <Label className="text-gray-600">User Limit:</Label>
                                <Input
                                    type="number"
                                    name="limits.userLimit"
                                    value={formData?.limits?.userLimit || ''}
                                    onChange={handleInputChange}
                                    className="w-full mt-2 p-3 border border-gray-300 rounded-xl"
                                />
                            </div>
                            <div key="limits.departmentLimit">
                                <Label className="text-gray-600">Department Limit:</Label>
                                <Input
                                    type="number"
                                    name="limits.departmentLimit"
                                    value={formData?.limits?.departmentLimit || ''}
                                    onChange={handleInputChange}
                                    className="w-full mt-2 p-3 border border-gray-300 rounded-xl"
                                />
                            </div>
                            <div key="limits.medicineLimit">
                                <Label className="text-gray-600">Medicine Limit:</Label>
                                <Input
                                    type="number"
                                    name="limits.medicineLimit"
                                    value={formData?.limits?.medicineLimit || ''}
                                    onChange={handleInputChange}
                                    className="w-full mt-2 p-3 border border-gray-300 rounded-xl"
                                />
                            </div>
                            <div key="limits.saleLimitPerDay">
                                <Label className="text-gray-600">Sale Limit Per Day:</Label>
                                <Input
                                    type="number"
                                    name="limits.saleLimitPerDay"
                                    value={formData?.limits?.saleLimitPerDay || ''}
                                    onChange={handleInputChange}
                                    className="w-full mt-2 p-3 border border-gray-300 rounded-xl"
                                />
                            </div>


                            {/* Features List */}
                            <h4 className="mt-6 mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Features</h4>
                            {(formData?.features?.length > 0 ? formData.features : [{ key: '', label: '', description: '', isEnabled: true }])
                                .map((feature, index) => (
                                    <div key={index} className="grid grid-cols-1 gap-4 mb-4 lg:grid-cols-4">
                                        <Input
                                            type="text"
                                            name={`features.${index}.key`}
                                            placeholder="Key"
                                            value={feature.key}
                                            onChange={e => handleFeatureChange(e, index, 'key')}
                                        />
                                        <Input
                                            type="text"
                                            name={`features.${index}.label`}
                                            placeholder="Label"
                                            value={feature.label}
                                            onChange={e => handleFeatureChange(e, index, 'label')}
                                        />
                                        <Input
                                            type="text"
                                            name={`features.${index}.description`}
                                            placeholder="Description"
                                            value={feature.description}
                                            onChange={e => handleFeatureChange(e, index, 'description')}
                                        />
                                        <select
                                            value={feature.isEnabled}
                                            onChange={e => handleFeatureChange(e, index, 'isEnabled')}
                                        >
                                            <option value={true}>Enabled</option>
                                            <option value={false}>Disabled</option>
                                        </select>
                                    </div>
                                ))}
                            <Button type="button" onClick={(e) => {
                                e.preventDefault()
                                setFormData(prev => ({
                                    ...prev,
                                    features: [...(prev?.features || []), { key: '', label: '', description: '', isEnabled: true }]
                                }))
                            }}>
                                + Add Feature
                            </Button>
                        </div>
                        {/* Scrollable section ends */}

                        <h3 className="text-red-500 text-start ml-2">{ErrorMessage}</h3>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setShowModal(false);
                                    setErrorMessage('');
                                    setEditMode(false);
                                    setEditId('');
                                }}
                            >
                                Close
                            </Button>
                            <Button
                                onClick={e => handleAddSubscription(e)}
                                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
                            >
                                {editMode ? 'Update Subscription' : 'Add Subscription'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setErrorMessage('');
                }}
                className="max-w-[700px] m-4"
            >
                <div className="relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                        Are you sure you want to delete this plan?
                    </h2>
                    <div className="flex justify-end space-x-4">
                        <Button
                            onClick={() => setShowDeleteModal(false)} // Close the confirmation modal
                            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmDelete} // Confirm deletion
                            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200"
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>

    );
};

export default SubscriptionPlans;
