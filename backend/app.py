from flask import Flask, Blueprint, jsonify, request, make_response
from flask_cors import CORS, cross_origin
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import datetime, timedelta
from urllib.parse import urlparse
import logging
import traceback

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Inisialisasi Flask app
app = Flask(__name__)

# Konfigurasi CORS yang lebih sederhana
CORS(app, 
     resources={
         r"/api/*": {
             "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type"],
             "supports_credentials": True
         }
     })

def get_db_connection():
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        # Parse database URL
        result = urlparse(database_url)
        conn = psycopg2.connect(
            database=result.path[1:],
            user=result.username,
            password=result.password,
            host=result.hostname,
            port=result.port or 5432
        )
    else:
        # Fallback ke konfigurasi terpisah
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            port=os.getenv('DB_PORT', 5432)
        )
    return conn

# Global error handler
@app.errorhandler(500)
def handle_500(e):
    logger.error(f"Internal Server Error: {str(e)}")
    logger.error(traceback.format_exc())
    return jsonify({
        'status': 'error',
        'message': 'Internal Server Error',
        'error': str(e)
    }), 500

@app.route('/api/test-connection', methods=['GET'])
def test_connection():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Test query untuk mengecek tabel yang ada
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        
        tables = [table[0] for table in cur.fetchall()]
        
        # Test query untuk fact_complaints
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'fact_complaints'
            ORDER BY ordinal_position;
        """)
        
        columns = [{"name": col[0], "type": col[1]} for col in cur.fetchall()]
        
        cur.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Database connection successful',
            'tables': tables,
            'fact_complaints_columns': columns
        })
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/overview', methods=['GET'])
def get_overview():
    conn = None
    cur = None
    try:
        logger.info("Fetching overview data...")
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get total complaints and average resolution time
        cur.execute("""
            SELECT 
                COUNT(*) as total_complaints,
                AVG(CASE 
                    WHEN date_sent_key IS NOT NULL AND date_received_key IS NOT NULL 
                    THEN (
                        SELECT ds.full_date - dr.full_date
                        FROM dim_date ds, dim_date dr
                        WHERE ds.date_key = date_sent_key
                        AND dr.date_key = date_received_key
                    )
                    ELSE NULL 
                END) as avg_resolution_time
            FROM fact_complaints
        """)
        overview = cur.fetchone()
        logger.info(f"Overview query result: {overview}")
        
        # Get timely response percentage - with safer query
        cur.execute("""
            SELECT 
                COUNT(CASE WHEN r.timely_response = 'Yes' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as timely_response_rate,
                COUNT(CASE WHEN r.consumer_disputed = 'Yes' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as dispute_rate
            FROM fact_complaints f
            LEFT JOIN dim_response r ON f.response_key = r.response_key
        """)
        response_stats = cur.fetchone()
        logger.info(f"Response stats query result: {response_stats}")
        
        result = {
            'total_complaints': int(overview['total_complaints']) if overview['total_complaints'] else 0,
            'avg_resolution_time': 0 if overview['avg_resolution_time'] is None else round(float(overview['avg_resolution_time']), 2),
            'timely_response_rate': 0 if response_stats['timely_response_rate'] is None else round(float(response_stats['timely_response_rate']), 2),
            'dispute_rate': 0 if response_stats['dispute_rate'] is None else round(float(response_stats['dispute_rate']), 2)
        }
        
        logger.info(f"Returning result: {result}")
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in get_overview: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/complaints-trend', methods=['GET'])
def get_complaints_trend():
    conn = None
    cur = None
    try:
        logger.info("Fetching complaints trend data...")
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT 
                d.year,
                d.month,
                d.month_name,
                COUNT(*) as complaint_count,
                AVG(CASE 
                    WHEN f.date_sent_key IS NOT NULL AND f.date_received_key IS NOT NULL 
                    THEN (
                        SELECT ds.full_date - dr.full_date
                        FROM dim_date ds, dim_date dr
                        WHERE ds.date_key = f.date_sent_key
                        AND dr.date_key = f.date_received_key
                    )
                    ELSE NULL 
                END) as avg_resolution_time,
                SUM(f.complaint_count) as total_complaints
            FROM fact_complaints f
            LEFT JOIN dim_date d ON f.date_received_key = d.date_key
            WHERE d.year IS NOT NULL AND d.month IS NOT NULL
            GROUP BY d.year, d.month, d.month_name
            ORDER BY d.year, d.month
            LIMIT 100
        """)
        
        results = cur.fetchall()
        logger.info(f"Found {len(results)} trend records")
        
        formatted_results = []
        for row in results:
            formatted_row = dict(row)
            for key, value in formatted_row.items():
                if value is None:
                    formatted_row[key] = 0
                elif isinstance(value, float):
                    formatted_row[key] = round(value, 2)
            formatted_results.append(formatted_row)
        
        return jsonify(formatted_results)
    
    except Exception as e:
        logger.error(f"Error in get_complaints_trend: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/top-companies', methods=['GET'])
def get_top_companies():
    conn = None
    cur = None
    try:
        logger.info("Fetching top companies data...")
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT 
                c.company,
                COUNT(*) as complaint_count
            FROM fact_complaints f
            LEFT JOIN dim_company c ON f.company_key = c.company_key
            WHERE c.company IS NOT NULL
            GROUP BY c.company
            ORDER BY complaint_count DESC
            LIMIT 10
        """)
        
        results = cur.fetchall()
        logger.info(f"Found {len(results)} company records")
        return jsonify([dict(row) for row in results])
    
    except Exception as e:
        logger.error(f"Error in get_top_companies: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/issues-distribution', methods=['GET'])
def get_issues_distribution():
    conn = None
    cur = None
    try:
        logger.info("Fetching issues distribution data...")
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT 
                i.issue,
                i.sub_issue,
                COUNT(*) as count
            FROM fact_complaints f
            LEFT JOIN dim_issue i ON f.issue_key = i.issue_key
            WHERE i.issue IS NOT NULL
            GROUP BY i.issue, i.sub_issue
            ORDER BY count DESC
            LIMIT 50
        """)
        
        results = cur.fetchall()
        logger.info(f"Found {len(results)} issue records")
        return jsonify([dict(row) for row in results])
    
    except Exception as e:
        logger.error(f"Error in get_issues_distribution: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/state-distribution', methods=['GET'])
def get_state_distribution():
    conn = None
    cur = None
    try:
        logger.info("Fetching state distribution data...")
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT 
                l.state,
                l.zipcode,
                COUNT(*) as complaint_count
            FROM fact_complaints f
            LEFT JOIN dim_location l ON f.location_key = l.location_key
            WHERE l.state IS NOT NULL
            GROUP BY l.state, l.zipcode
            ORDER BY complaint_count DESC
            LIMIT 100
        """)
        
        results = cur.fetchall()
        logger.info(f"Found {len(results)} location records")
        return jsonify([dict(row) for row in results])
    
    except Exception as e:
        logger.error(f"Error in get_state_distribution: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/response-channels', methods=['GET'])
def get_response_channels():
    conn = None
    cur = None
    try:
        logger.info("Fetching response channels data...")
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT 
                r.submitted_via,
                r.company_response_to_consumer,
                r.consumer_consent_provided,
                COUNT(*) as count
            FROM fact_complaints f
            LEFT JOIN dim_response r ON f.response_key = r.response_key
            WHERE r.submitted_via IS NOT NULL
            GROUP BY 
                r.submitted_via,
                r.company_response_to_consumer,
                r.consumer_consent_provided
            ORDER BY count DESC
            LIMIT 50
        """)
        
        results = cur.fetchall()
        logger.info(f"Found {len(results)} response channel records")
        return jsonify([dict(row) for row in results])
    
    except Exception as e:
        logger.error(f"Error in get_response_channels: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/complaint-details', methods=['GET'])
def get_complaint_details():
    conn = None
    cur = None
    try:
        logger.info("Fetching complaint details data...")
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT 
                cd.consumer_complaint_narrative,
                cd.company_public_response,
                cd.tags,
                f.complaint_count,
                f.days_to_send
            FROM fact_complaints f
            LEFT JOIN dim_complaint_detail cd ON f.complaint_detail_key = cd.complaint_detail_key
            LIMIT 100
        """)
        
        results = cur.fetchall()
        logger.info(f"Found {len(results)} complaint detail records")
        return jsonify([dict(row) for row in results])
    
    except Exception as e:
        logger.error(f"Error in get_complaint_details: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
        
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# Basic health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Flask app is running'})

@app.route('/api/issue-product-heatmap', methods=['GET'])
def issue_product_heatmap():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.product, i.issue, COUNT(*) as count
        FROM fact_complaints f
        LEFT JOIN dim_product p ON f.product_key = p.product_key
        LEFT JOIN dim_issue i ON f.issue_key = i.issue_key
        WHERE p.product IS NOT NULL AND i.issue IS NOT NULL
        GROUP BY p.product, i.issue
    """)
    data = cur.fetchall()
    cur.close()
    conn.close()
    # Format: [{product, issue, count}]
    return jsonify([{'product': row[0], 'issue': row[1], 'count': row[2]} for row in data])

@app.route('/api/dispute-by-response', methods=['GET'])
def dispute_by_response():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT r.company_response_to_consumer, 
               SUM(CASE WHEN r.consumer_disputed = 'Yes' THEN 1 ELSE 0 END) as disputed,
               SUM(CASE WHEN r.consumer_disputed = 'No' THEN 1 ELSE 0 END) as not_disputed
        FROM fact_complaints f
        LEFT JOIN dim_response r ON f.response_key = r.response_key
        WHERE r.company_response_to_consumer IS NOT NULL
        GROUP BY r.company_response_to_consumer
    """)
    data = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([{'response_type': row[0], 'disputed': row[1], 'not_disputed': row[2]} for row in data])

@app.route('/api/timely-by-channel', methods=['GET'])
def timely_by_channel():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT r.submitted_via, 
               SUM(CASE WHEN r.timely_response = 'Yes' THEN 1 ELSE 0 END) as timely,
               COUNT(*) as total
        FROM fact_complaints f
        LEFT JOIN dim_response r ON f.response_key = r.response_key
        WHERE r.submitted_via IS NOT NULL
        GROUP BY r.submitted_via
    """)
    data = cur.fetchall()
    cur.close()
    conn.close()
    # Format: [{channel, timely_rate}]
    return jsonify([
        {'channel': row[0], 'timely_rate': round(row[1]/row[2]*100, 2) if row[2] else 0} for row in data
    ])

@app.route('/api/avg-response-by-product', methods=['GET'])
def avg_response_by_product():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.product, AVG(ds.full_date - dr.full_date) as avg_days
        FROM fact_complaints f
        LEFT JOIN dim_product p ON f.product_key = p.product_key
        LEFT JOIN dim_date ds ON f.date_sent_key = ds.date_key
        LEFT JOIN dim_date dr ON f.date_received_key = dr.date_key
        WHERE p.product IS NOT NULL AND ds.full_date IS NOT NULL AND dr.full_date IS NOT NULL
        GROUP BY p.product
        ORDER BY avg_days
        LIMIT 10
    """)
    data = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([{'product': row[0], 'avg_days': round(row[1], 2) if row[1] else 0} for row in data])

@app.route('/api/response-stats', methods=['GET'])
def response_stats():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT r.timely_response, COUNT(*) FROM fact_complaints f
        LEFT JOIN dim_response r ON f.response_key = r.response_key
        WHERE r.timely_response IS NOT NULL
        GROUP BY r.timely_response
    """)
    timely = {row[0]: row[1] for row in cur.fetchall()}
    cur.execute("""
        SELECT r.consumer_disputed, COUNT(*) FROM fact_complaints f
        LEFT JOIN dim_response r ON f.response_key = r.response_key
        WHERE r.consumer_disputed IS NOT NULL
        GROUP BY r.consumer_disputed
    """)
    dispute = {row[0]: row[1] for row in cur.fetchall()}
    cur.close()
    conn.close()
    return jsonify({'timely_response': timely, 'dispute': dispute})

if __name__ == '__main__':
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Print database connection info (securely)
    db_url = os.getenv('DATABASE_URL')
    if db_url:
        masked_url = db_url.replace(db_url.split('@')[0], '***:***')
        logger.info(f"Using database URL: {masked_url}")
    else:
        logger.info(f"Using database host: {os.getenv('DB_HOST', 'localhost')}")
        logger.info(f"Using database name: {os.getenv('DB_NAME', 'not set')}")
    
    logger.info("Starting Flask application...")
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))