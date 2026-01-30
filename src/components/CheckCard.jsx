import React from 'react';
import { Mail, CreditCard, XCircle, Ban, DollarSign, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { STATUS_OPTIONS } from '../utils/constants'; // Standard relative path
import styles from './CheckCard.module.css';

const IconMap = {
    Mail, CreditCard, XCircle, Ban, DollarSign, HelpCircle
};

const CheckCard = ({ check, onStatusChange, expanded, onToggleExpand }) => {
    const currentStatus = STATUS_OPTIONS.find(s => s.id === check.status) || STATUS_OPTIONS[5]; // Default unknown

    return (
        <div className={`${styles.card} ${check.status !== 'unknown' ? styles.completed : ''}`}>
            <div className={styles.header} onClick={onToggleExpand}>
                <div className={styles.mainInfo}>
                    <div className={styles.checkNumBadge}>#{check.checkNumber}</div>
                    <div className={styles.payee}>{check.payee}</div>
                    <div className={styles.statusBadge} style={{ borderColor: currentStatus.color, color: currentStatus.color }}>
                        {/* Render Icon */}
                        {(() => {
                            const Icon = IconMap[currentStatus.icon];
                            return Icon ? <Icon size={14} style={{ marginRight: 6 }} /> : null;
                        })()}
                        {currentStatus.label}
                    </div>
                </div>
                <div className={styles.amountInfo}>
                    <div className={styles.amount}>${check.amount}</div>
                    {expanded ? <ChevronUp size={20} className={styles.chevron} /> : <ChevronDown size={20} className={styles.chevron} />}
                </div>
            </div>

            {expanded && (
                <div className={styles.details}>
                    <div className={styles.metaGrid}>
                        <div className={styles.metaItem}>
                            <label>Date</label>
                            <span>{check.date}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <label>Memo</label>
                            <span>{check.memo}</span>
                        </div>
                    </div>

                    <div className={styles.propertySection}>
                        <h3>Properties</h3>
                        {check.properties.map((prop, idx) => (
                            <div key={idx} className={styles.propertyItem}>
                                <div>
                                    <span className={styles.propName}>{prop.name}</span>
                                    <span className={styles.propGl}>{prop.glName}</span>
                                </div>
                                <span className={styles.propAmount}>${prop.amount}</span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.actions}>
                        {STATUS_OPTIONS.map((opt) => {
                            const Icon = IconMap[opt.icon];
                            const isActive = check.status === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    className={`${styles.actionBtn} ${isActive ? styles.active : ''}`}
                                    onClick={() => onStatusChange(check.id, opt.id)}
                                    style={isActive ? { backgroundColor: opt.color, borderColor: opt.color } : {}}
                                >
                                    {Icon && <Icon size={16} />}
                                    <span>{opt.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckCard;
