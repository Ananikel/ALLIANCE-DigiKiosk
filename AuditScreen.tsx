
import React from 'react';
import { useTheme, useI18n } from './contexts';
import { MOCK_AUDIT } from './constants';

const AuditScreen = () => {
    const { t } = useI18n();
    const { theme } = useTheme();
    const isDark = theme === 'blue-dark';

    return (
        <div className="h-full flex flex-col">
             <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('nav.audit')}</h1>
             <div className={`flex-1 rounded-xl border overflow-hidden shadow-sm ${isDark ? 'border-gray-700 bg-dark-surface' : 'border-gray-200 bg-white'}`}>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className={isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'}>
                            <tr>
                                <th className="p-4">{t('audit.date')}</th>
                                <th className="p-4">{t('audit.actor')}</th>
                                <th className="p-4">{t('audit.action')}</th>
                                <th className="p-4">{t('audit.details')}</th>
                            </tr>
                        </thead>
                        <tbody className={isDark ? 'divide-y divide-gray-800 text-gray-300' : 'divide-y divide-gray-100 text-gray-700'}>
                             {MOCK_AUDIT.map(item => (
                                <tr key={item.id} className={`transition-colors ${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}`}>
                                    <td className="p-4 font-mono text-sm opacity-80">{item.created_at}</td>
                                    <td className="p-4 font-bold">{item.actor_name}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                                            {item.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm">{item.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
};

export default AuditScreen;
